import { getAsset, getDownstreamAssets } from "../api/index.js";
import {
  createComment,
  getChangedFiles,
  getAssetName,
} from "../utils/index.js";

export default async function printDownstreamAssets({ octokit, context }) {
  const changedFiles = await getChangedFiles(octokit, context);

  changedFiles.forEach(async ({ name, filePath }) => {
    const assetName = await getAssetName(octokit, context, name, filePath);
    const asset = await getAsset({ name: assetName });

    if (!asset) return;

    const { guid } = asset.attributes.sqlAsset;
    const downstreamAssets = await getDownstreamAssets(guid);

    const comment = await createComment(
      octokit,
      context,
      asset,
      downstreamAssets
    );
    console.log(comment);
  });
}
