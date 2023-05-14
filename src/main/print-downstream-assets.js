import {
    getAsset, getClassifications,
    getDownstreamAssets,
    sendSegmentEvent,
} from "../api/index.js";
import {
    renderDownstreamAssetsComment,
    getChangedFiles,
    getAssetName, createIssueComment, checkCommentExists, deleteComment, getImageURL, getConnectorImage
} from "../utils/index.js";
import {isIgnoreModelAliasMatching} from "../utils/get-environment-variables.js";

export default async function printDownstreamAssets({octokit, context}) {
    const changedFiles = await getChangedFiles(octokit, context);
    let comments = ``;
    let totalChangedFiles = 0;

    for (const {fileName, filePath, status} of changedFiles) {
        const aliasName = await getAssetName({octokit, context, fileName, filePath});
        const assetName = isIgnoreModelAliasMatching() ? fileName : aliasName;
        const asset = await getAsset({name: assetName});

        if (totalChangedFiles !== 0)
            comments += '\n\n---\n\n';

        if (status === "added") {
            comments += `### ${getConnectorImage('dbt')} <b>${fileName}</b> 🆕
Its a new model and not present in Atlan yet, you'll see the downstream impact for it after its present in Atlan.`
            totalChangedFiles++
            continue;
        }

        if (asset.error) {
            comments += asset.error;
            totalChangedFiles++
            continue;
        }

        const materialisedAsset = asset.attributes.dbtModelSqlAssets[0];
        const timeStart = Date.now();
        const downstreamAssets = await getDownstreamAssets(asset, materialisedAsset.guid, octokit, context);

        if (downstreamAssets.error) {
            comments += downstreamAssets.error;
            totalChangedFiles++
            continue;
        }

        sendSegmentEvent("dbt_ci_action_downstream_unfurl", {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.length,
            total_fetch_time: Date.now() - timeStart,
        });

        const classifications = await getClassifications();

        const comment = await renderDownstreamAssetsComment(
            octokit,
            context,
            asset,
            materialisedAsset,
            downstreamAssets,
            classifications
        )

        comments += comment;

        totalChangedFiles++
    }

    comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} ${totalChangedFiles > 1 ? "models" : "model"}** you have edited.    
    
${comments}`

    const existingComment = await checkCommentExists(octokit, context);

    if (totalChangedFiles > 0)
        await createIssueComment(octokit, context, comments, existingComment?.id)

    if (totalChangedFiles === 0 && existingComment)
        await deleteComment(octokit, context, existingComment.id)

    return totalChangedFiles;
}
