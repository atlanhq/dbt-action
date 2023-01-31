import {
    getAsset,
    getDownstreamAssets,
    sendSegmentEvent,
} from "../api/index.js";
import {
    renderDownstreamAssetsComment,
    getChangedFiles,
    getAssetName, createIssueComment, checkCommentExists, deleteComment, getImageURL
} from "../utils/index.js";

export default async function printDownstreamAssets({octokit, context}) {
    const changedFiles = await getChangedFiles(octokit, context);
    let comments = ``;
    var totalChangedFiles = 0

    if (changedFiles.length === 0) return;

    for (const {fileName, filePath} of changedFiles) {
        const assetName = await getAssetName({octokit, context, fileName, filePath});
        const asset = await getAsset({name: assetName});

        if (!asset) return;

        const {guid} = asset.attributes.sqlAsset;
        const timeStart = Date.now();
        const downstreamAssets = await getDownstreamAssets(asset, guid, octokit, context);

        if (totalChangedFiles !== 0)
            comments += '\n\n---\n\n';

        if (downstreamAssets.length === 0) continue;

        sendSegmentEvent("dbt_ci_action_downstream_unfurl", {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.length,
            total_fetch_time: Date.now() - timeStart,
        });

        const comment = await renderDownstreamAssetsComment(
            octokit,
            context,
            asset,
            downstreamAssets
        )

        comments += comment;

        totalChangedFiles++
    }

    comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} models** you have edited.    
    
${comments}`

    const existingComment = await checkCommentExists(octokit, context);
    await createIssueComment(octokit, context, comments, existingComment?.id)

    if (totalChangedFiles === 0 && existingComment)
        await deleteComment(octokit, context, existingComment.id)

    return totalChangedFiles;
}
