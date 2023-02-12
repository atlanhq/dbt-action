import dotenv from "dotenv";
import core from "@actions/core";

import {getCertificationImage, getConnectorImage, getImageURL,} from "./index.js";

dotenv.config();

const {IS_DEV} = process.env;
const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;

export async function renderDownstreamAssetsComment(
    asset,
    downstreamAssets
) {
    let impactedData = downstreamAssets.map(
        ({displayText, guid, typeName, attributes, meanings}) => {
            let readableTypeName = typeName
                .toLowerCase()
                .replace(attributes.connectorName, "")
                .toUpperCase();
            readableTypeName = readableTypeName.charAt(0).toUpperCase() + readableTypeName.slice(1).toLowerCase()
            return [
                guid, displayText, attributes.connectorName, readableTypeName, attributes?.userDescription || attributes?.description || "", attributes?.certificateStatus || "", [...attributes?.ownerUsers, ...attributes?.ownerGroups] || [], meanings.map(
                    ({displayText, termGuid}) =>
                        `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}?utm_source=dbt_github_action)`
                )
                    ?.join(", ") || " ", attributes?.sourceURL || ""
            ];
        }
    );

    impactedData = impactedData.sort((a, b) => a[3].localeCompare(b[3])); // Sort by typeName
    impactedData = impactedData.sort((a, b) => a[2].localeCompare(b[2])); // Sort by connectorName

    let rows = impactedData.map(([guid, displayText, connectorName, typeName, description, certificateStatus, owners, meanings, sourceUrl]) => {
        const connectorImage = getConnectorImage(connectorName),
            certificationImage = certificateStatus
                ? getCertificationImage(certificateStatus)
                : "";

        return [`${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}?utm_source=dbt_github_action) ${certificationImage}`,
            `\`${typeName}\``,
            description,
            owners.join(", ") || " ",
            meanings,
            sourceUrl ? `[Open in ${connectorName}](${sourceUrl})` : " "]
    })

    const comment = `### ${getConnectorImage(asset.attributes.connectorName)} [${
        asset.displayText
    }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=dbt_github_action) ${
        asset.attributes?.certificateStatus
            ? getCertificationImage(asset.attributes.certificateStatus)
            : ""
    }
        
  **${downstreamAssets.length} downstream assets** 👇
  Name | Type | Description | Owners | Terms | Source URL
  --- | --- | --- | --- | --- | ---
  ${rows.map((row) => row.map(i => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")).join("\n")}
  
  ${getImageURL("atlan-logo", 15, 15)} [View asset in Atlan](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=dbt_github_action)`;

    return comment
}

export async function checkCommentExistsOnGithub(octokit, context) {
    if (IS_DEV) return null;

    const {pull_request} = context.payload;

    const comments = await octokit.rest.issues.listComments({
        ...context.repo,
        issue_number: pull_request.number,
    });

    return comments.data.find(
        (comment) => comment.user.login === "github-actions[bot]" && comment.body.includes("<!-- ActionCommentIdentifier: atlan-dbt-action -->")
    );
}

export async function checkCommentExistsOnGitlab(gitlab) {
    const {CI_PROJECT_ID, CI_MERGE_REQUEST_IID} = process.env
    if (IS_DEV) return null;

    const comments = await gitlab.MergeRequestNotes.all(
        CI_PROJECT_ID,
        CI_MERGE_REQUEST_IID,
    );

    return comments.find(
        (comment) => comment.author.username === "Jaagrav" && comment.body.includes("<!-- ActionCommentIdentifier: atlan-dbt-action -->")
    );
}

export async function createIssueCommentOnGithub(octokit, context, content, comment_id = null, forceNewComment = false) {
    const {pull_request} = context.payload;

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`

    const commentObj = {
        ...context.repo,
        issue_number: pull_request.number,
        body: content,
    };

    console.log(content)

    if (IS_DEV) return content;

    if (comment_id && !forceNewComment) return octokit.rest.issues.updateComment({...commentObj, comment_id});
    return octokit.rest.issues.createComment(commentObj);
}

export async function createIssueCommentOnGitlab(gitlab, content, comment_id = null, forceNewComment = false) {
    const {CI_PROJECT_ID, CI_MERGE_REQUEST_IID} = process.env

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`

    console.log(content)
    
    if (IS_DEV) return content;

    if (comment_id && !forceNewComment)
        return await gitlab.MergeRequestNotes.edit(
            CI_PROJECT_ID,
            CI_MERGE_REQUEST_IID,
            comment_id,
            content
        );
    return await gitlab.MergeRequestNotes.create(CI_PROJECT_ID, CI_MERGE_REQUEST_IID, content)
}

export async function deleteCommentOnGithub(octokit, context, comment_id) {
    const {pull_request} = context.payload;

    return octokit.rest.issues.deleteComment({
        ...context.repo,
        issue_number: pull_request.number,
        comment_id,
    });
}

export async function deleteCommentOnGitlab(gitlab, comment_id) {
    const {CI_PROJECT_ID, CI_MERGE_REQUEST_IID} = process.env

    return await gitlab.MergeRequestNotes.remove(CI_PROJECT_ID, CI_MERGE_REQUEST_IID, comment_id)
}