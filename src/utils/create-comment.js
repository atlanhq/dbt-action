import dotenv from "dotenv";
import core from "@actions/core";

import {getCertificationImage, getConnectorImage, getImageURL,} from "./index.js";

dotenv.config();

const {IS_DEV} = process.env;
const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;

export default async function renderDownstreamAssetsComment(
    octokit,
    context,
    asset,
    downstreamAssets
) {
    const rows = downstreamAssets.map(
        ({displayText, guid, typeName, attributes, meanings}) => {
            const connectorImage = getConnectorImage(attributes.connectorName),
                certificationImage = attributes?.certificateStatus
                    ? getCertificationImage(attributes?.certificateStatus)
                    : "",
                readableTypeName = typeName
                    .toLowerCase()
                    .replace(attributes.connectorName, "")
                    .toUpperCase();

            return [
                `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}?utm_source=dbt_github_action) ${certificationImage}`,
                `\`${readableTypeName}\``,
                attributes?.userDescription || attributes?.description || " ",
                attributes?.ownerUsers?.join(", ") || " ",
                meanings
                    .map(
                        ({displayText, termGuid}) =>
                            `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}?utm_source=dbt_github_action)`
                    )
                    ?.join(", ") || " ",
                attributes?.sourceURL || " ",
            ];
        }
    );

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
  ${rows.map((row) => row.map(i => i.replace(/\|/g, "•")).join(" | ")).join("\n")}
  
  [${getImageURL("atlan-view-asset-button", 30, 135)}](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=dbt_github_action)`;

    return comment
}

export async function checkCommentExists(octokit, context) {
    const {pull_request} = context.payload;

    const comments = await octokit.rest.issues.listComments({
        ...context.repo,
        issue_number: pull_request.number,
    });

    return comments.data.find(
        (comment) => comment.user.login === "github-actions[bot]" && comment.body.includes("<!-- ActionCommentIdentifier: atlan-dbt-action -->")
    );
}

export async function createIssueComment(octokit, context, content, comment_id = null) {
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

    if (comment_id) return octokit.rest.issues.updateComment({...commentObj, comment_id});
    return octokit.rest.issues.createComment(commentObj);
}

export async function deleteComment(octokit, context, comment_id) {
    const {pull_request} = context.payload;

    return octokit.rest.issues.deleteComment({
        ...context.repo,
        issue_number: pull_request.number,
        comment_id,
    });
}