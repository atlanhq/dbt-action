import {
    getAsset,
    getDownstreamAssets,
    sendSegmentEvent,
} from "../api/index.js";
import {
    renderDownstreamAssetsComment,
    getChangedFiles,
    getAssetName, createIssueComment, checkCommentExists, deleteComment
} from "../utils/index.js";

export default async function printDownstreamAssets({octokit, context}) {
    const changedFiles = await getChangedFiles(octokit, context);
    let comments = ``;
    let totalChangedFiles = 0;

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

    const existingComment = await checkCommentExists(octokit, context);
    await createIssueComment(octokit, context, comments, existingComment?.id)

    if (totalChangedFiles === 0 && existingComment)
        await deleteComment(octokit, context, existingComment.id)

    return totalChangedFiles;
}
