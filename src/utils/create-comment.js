import {getCertificationImage, getConnectorImage, getImageURL,} from "./index.js";
import {getInstanceUrl, isDev} from "./get-environment-variables.js";

const IS_DEV = isDev();
const ATLAN_INSTANCE_URL =
    getInstanceUrl();

export default async function renderDownstreamAssetsComment(
    octokit,
    context,
    asset,
    materialisedAsset,
    downstreamAssets,
    classifications
) {
    // Mapping the downstream assets data
    let impactedData = downstreamAssets.entities.map(
        ({
             displayText,
             guid,
             typeName,
             attributes,
             meanings,
             classificationNames
         }) => {
            // Modifying the typeName and getting the readableTypeName
            let readableTypeName = typeName
                .toLowerCase()
                .replace(attributes.connectorName, "")
                .toUpperCase();

            // Filtering classifications based on classificationNames
            let classificationsObj = classifications.filter(({name}) =>
                classificationNames.includes(name)
            );

            // Modifying the readableTypeName
            readableTypeName = readableTypeName.charAt(0).toUpperCase() + readableTypeName.slice(1).toLowerCase();

            return [
                guid,
                displayText,
                attributes.connectorName,
                readableTypeName,
                attributes?.userDescription || attributes?.description || "",
                attributes?.certificateStatus || "",
                [...attributes?.ownerUsers, ...attributes?.ownerGroups] || [],
                meanings.map(({displayText, termGuid}) =>
                    `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}/overview?utm_source=dbt_github_action)`
                )
                    ?.join(", ") || " ",
                classificationsObj?.map(({name, displayName}) =>
                    `\`${displayName}\``
                )?.join(', ') || " ",
                attributes?.sourceURL || ""
            ];
        }
    );

    // Sorting the impactedData first by typeName and then by connectorName
    impactedData = impactedData.sort((a, b) => a[3].localeCompare(b[3]));
    impactedData = impactedData.sort((a, b) => a[2].localeCompare(b[2]));

    // Creating rows for the downstream table
    let rows = impactedData.map(
        ([guid, displayText, connectorName, typeName, description, certificateStatus, owners, meanings, classifications, sourceUrl]) => {
            // Getting connector and certification images
            const connectorImage = getConnectorImage(connectorName);
            const certificationImage = certificateStatus ? getCertificationImage(certificateStatus) : "";

            return [
                `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}/overview?utm_source=dbt_github_action) ${certificationImage}`,
                `\`${typeName}\``,
                description.length > 100 ? description.substring(0, 100) + '...' : description,
                owners.join(", ") || " ",
                meanings,
                classifications,
                sourceUrl ? `[Open in ${connectorName}](${sourceUrl})` : " "
            ];
        }
    );

    // Generating asset information
    const assetInfo = `### ${getConnectorImage(asset.attributes.connectorName)} [${
        asset.displayText
    }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action) ${
        asset.attributes?.certificateStatus
            ? getCertificationImage(asset.attributes.certificateStatus)
            : ""
    }
Materialised asset: ${getConnectorImage(materialisedAsset.attributes.connectorName)} [${
        materialisedAsset.attributes.name
    }](${ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/overview?utm_source=dbt_github_action) ${
        materialisedAsset.attributes?.certificateStatus
            ? getCertificationImage(materialisedAsset.attributes.certificateStatus)
            : ""
    } | Environment Name: \`${materialisedAsset.attributes.assetDbtEnvironmentName}\` | Project Name: \`${materialisedAsset.attributes.assetDbtProjectName}\``;

    // Generating the downstream table
    const downstreamTable = `<details><summary><b>${downstreamAssets.entityCount} downstream assets 👇</b></summary><br/>

Name | Type | Description | Owners | Terms | Classifications | Source URL
--- | --- | --- | --- | --- | --- | ---       
${rows.map((row) => row.map(i => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")).join("\n")}

${downstreamAssets.hasMore ? `[See more downstream assets at Atlan](${ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/lineage?utm_source=dbt_github_action)` : ""}

</details>`;

    // Generating the "View asset in Atlan" button
    const viewAssetButton = `${getImageURL("atlan-logo", 15, 15)} [View asset in Atlan](${ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action)`;

    // Generating the final comment based on the presence of downstream assets
    if (downstreamAssets.entities.length > 0) {
        return `${assetInfo}
        
${downstreamTable}

${viewAssetButton}`;
    } else {
        return `${assetInfo}
        
No downstream assets found.

${viewAssetButton}`;
    }
}


export async function checkCommentExists(octokit, context) {
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

export async function createIssueComment(octokit, context, content, comment_id = null, forceNewComment = false) {
    const {pull_request} = context.payload;

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`

    const commentObj = {
        ...context.repo,
        issue_number: pull_request.number,
        body: content,
    };

    console.log(content, content.length)

    if (IS_DEV) return content;

    if (comment_id && !forceNewComment) return octokit.rest.issues.updateComment({...commentObj, comment_id});
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
