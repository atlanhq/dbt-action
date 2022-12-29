import {
    getAsset,
    getDownstreamAssets,
    sendSegmentEvent,
} from "../api/index.js";
import {
    createComment,
    getChangedFiles,
    getAssetName,
} from "../utils/index.js";

export default async function printDownstreamAssets({octokit, context}) {
    const changedFiles = await getChangedFiles(octokit, context);
    var totalChangedFiles = 0

    if (changedFiles.length === 0) return;

    for (const {fileName, filePath} of changedFiles) {
        const assetName = await getAssetName({octokit, context, fileName, filePath});
        const asset = await getAsset({name: assetName});

        if (!asset) return;

        const {guid} = asset.attributes.sqlAsset;
        const timeStart = Date.now();
        const downstreamAssets = await getDownstreamAssets(asset, guid, octokit, context);

        if (downstreamAssets.length === 0) continue;

        sendSegmentEvent("dbt_ci_action_downstream_unfurl", {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.length,
            total_fetch_time: Date.now() - timeStart,
        });

        await createComment(
            octokit,
            context,
            asset,
            downstreamAssets
        );

        totalChangedFiles++
    }

    return totalChangedFiles;
}
