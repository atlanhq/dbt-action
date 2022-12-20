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

export default async function printDownstreamAssets({ octokit, context }) {
  const changedFiles = await getChangedFiles(octokit, context);

  if (changedFiles.length === 0) return;

  for (const { name, filePath } of changedFiles) {
    const assetName = await getAssetName(octokit, context, name, filePath);
    const asset = await getAsset({ name: assetName });

    if (!asset) return;

    const { guid } = asset.attributes.sqlAsset;
    const timeStart = Date.now();
    const downstreamAssets = await getDownstreamAssets(guid);

    sendSegmentEvent("dbt_ci_action_downstream_unfurl", {
      asset_guid: asset.guid,
      asset_type: asset.typeName,
      downstream_count: downstreamAssets.length,
      total_fetch_time: Date.now() - timeStart,
    });

    const comment = await createComment(
      octokit,
      context,
      asset,
      downstreamAssets
    );
    console.log(comment);
  }

  return changedFiles.length;
}
