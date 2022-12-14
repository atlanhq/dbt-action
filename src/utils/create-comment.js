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
                `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}?utm_source=github) ${certificationImage}`,
                `\`${readableTypeName}\``,
                attributes?.userDescription || attributes?.description || "--",
                attributes?.ownerUsers?.join(", ") || "--",
                meanings
                    .map(
                        ({displayText, termGuid}) =>
                            `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}?utm_source=github)`
                    )
                    ?.join(", ") || "--",
                attributes?.sourceURL || "--",
            ];
        }
    );

    const comment = `
  ## ${getConnectorImage(asset.attributes.connectorName)} [${
        asset.displayText
    }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=github) ${
        asset.attributes?.certificateStatus
            ? getCertificationImage(asset.attributes.certificateStatus)
            : ""
    }
  \`${asset.typeName
        .toLowerCase()
        .replace(asset.attributes.connectorName, "")
        .toUpperCase()}\`
        
  There are ${downstreamAssets.length} downstream asset(s).
  Name | Type | Description | Owners | Terms | Source URL
  --- | --- | --- | --- | --- | ---
  ${rows.map((row) => row.join(" | ")).join("\n")}
  
  ${getImageURL(
        "atlan-logo"
    )} [View asset on Atlan.](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=github)`;

    const commentObj = {
        ...context.repo,
        issue_number: pull_request.number,
        body: comment,
    };

    console.log(comment)

    if (IS_DEV) return comment;
    return octokit.rest.issues.createComment(commentObj);
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