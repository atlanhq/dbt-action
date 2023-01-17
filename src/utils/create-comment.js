import dotenv from "dotenv";
import core from "@actions/core";

import {
    getConnectorImage,
    getCertificationImage,
    getImageURL,
} from "./index.js";

dotenv.config();

const {IS_DEV} = process.env;
const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;

export default async function createComment(
    octokit,
    context,
    asset,
    downstreamAssets
) {
    const {pull_request} = context.payload;

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

    const comment = `
  ## ${getConnectorImage(asset.attributes.connectorName)} [${
        asset.displayText
    }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=dbt_github_action) ${
        asset.attributes?.certificateStatus
            ? getCertificationImage(asset.attributes.certificateStatus)
            : ""
    }
        
  There are ${downstreamAssets.length} downstream assets.
  Name | Type | Description | Owners | Terms | Source URL
  --- | --- | --- | --- | --- | ---
  ${rows.map((row) => row.replace(/\|/g, "•").join(" | ")).join("\n")}
  
  ${getImageURL(
        "atlan-logo"
    )} [View asset on Atlan.](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=dbt_github_action)`;

    const commentObj = {
        ...context.repo,
        issue_number: pull_request.number,
        body: comment,
    };

    const existingComment = await checkCommentExists(octokit, context, asset);

    if (IS_DEV) return comment;

    if (existingComment)
        return octokit.rest.issues.updateComment({...commentObj, comment_id: existingComment.id});
    return octokit.rest.issues.createComment(commentObj);
}

export async function checkCommentExists(octokit, context, asset) {
    const {pull_request} = context.payload;

    const comments = await octokit.rest.issues.listComments({
        ...context.repo,
        issue_number: pull_request.number,
    });

    const commentExists = comments.data.find(
        (comment) => comment.body.includes(asset.guid) && comment.user.login === "github-actions[bot]"
    );

    return commentExists;
}

export async function createCustomComment(octokit, context, content) {
    const {pull_request} = context.payload;
    const commentObj = {
        ...context.repo,
        issue_number: pull_request.number,
        body: content,
    };

    console.log(content)

    if (IS_DEV) return content;
    return octokit.rest.issues.createComment(commentObj);
}