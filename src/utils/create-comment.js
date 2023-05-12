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
    let impactedData = downstreamAssets.map(
        ({displayText, guid, typeName, attributes, meanings, classificationNames}) => {
            let readableTypeName = typeName
                    .toLowerCase()
                    .replace(attributes.connectorName, "")
                    .toUpperCase(),
                classificationsObj = classifications.filter(({name}) => classificationNames.includes(name));
            readableTypeName = readableTypeName.charAt(0).toUpperCase() + readableTypeName.slice(1).toLowerCase()

            return [
                guid, displayText, attributes.connectorName, readableTypeName, attributes?.userDescription || attributes?.description || "", attributes?.certificateStatus || "", [...attributes?.ownerUsers, ...attributes?.ownerGroups] || [], meanings.map(
                    ({displayText, termGuid}) =>
                        `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}/overview?utm_source=dbt_github_action)`,
                )
                    ?.join(", ") || " ",
                classificationsObj?.map(({
                                             name,
                                             displayName
                                         }) => `\`${displayName}\``)?.join(', ') || " ", attributes?.sourceURL || ""
            ];
        }
    );

    impactedData = impactedData.sort((a, b) => a[3].localeCompare(b[3])); // Sort by typeName
    impactedData = impactedData.sort((a, b) => a[2].localeCompare(b[2])); // Sort by connectorName

    let rows = impactedData.map(([guid, displayText, connectorName, typeName, description, certificateStatus, owners, meanings, classifications, sourceUrl]) => {
        const connectorImage = getConnectorImage(connectorName),
            certificationImage = certificateStatus
                ? getCertificationImage(certificateStatus)
                : "";

        return [`${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}/overview?utm_source=dbt_github_action) ${certificationImage}`,
            `\`${typeName}\``,
            description,
            owners.join(", ") || " ",
            meanings,
            classifications,
            sourceUrl ? `[Open in ${connectorName}](${sourceUrl})` : " "]
    })

    const assetInfo = `### ${getConnectorImage(asset.attributes.connectorName)} [${
        asset.displayText
    }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action) ${
        asset.attributes?.certificateStatus
            ? getCertificationImage(asset.attributes.certificateStatus)
            : ""
    }`

    const downstreamTable = `<details><summary><b>${downstreamAssets.length} downstream assets 👇</b></summary><br/>

Materialised asset: ${getConnectorImage(materialisedAsset.attributes.connectorName)} [${
        materialisedAsset.attributes.name
    }](${ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/overview?utm_source=dbt_github_action) ${
        materialisedAsset.attributes?.certificateStatus
            ? getCertificationImage(materialisedAsset.attributes.certificateStatus)
            : ""
    } | Environment Name: \`${materialisedAsset.attributes.assetDbtEnvironmentName}\` | Project Name: \`${materialisedAsset.attributes.assetDbtProjectName}\`

Name | Type | Description | Owners | Terms | Classifications | Source URL
--- | --- | --- | --- | --- | --- | ---       
${rows.map((row) => row.map(i => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")).join("\n")}
</details>`

    const viewAssetButton = `${getImageURL("atlan-logo", 15, 15)} [View asset in Atlan](${ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action)`

    if (downstreamAssets.length > 0)
        return `${assetInfo}
        
${downstreamTable}

${viewAssetButton}`;

    return `${assetInfo}
        
No downstream assets found.

${viewAssetButton}`
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

    console.log(content)

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