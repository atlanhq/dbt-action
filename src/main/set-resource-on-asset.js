import { getAsset, createResource } from "../api/index.js";
import {
  createCustomComment,
  getChangedFiles,
  getAssetName,
} from "../utils/index.js";

export default async function setResourceOnAsset({ octokit, context }) {
  const changedFiles = await getChangedFiles(octokit, context);
  const { pull_request } = context.payload;

  if (changedFiles.length === 0) return;

  changedFiles.forEach(async ({ name, filePath }) => {
    const assetName = await getAssetName(octokit, context, name, filePath);
    const asset = await getAsset({ name: assetName });

    if (!asset) return;

    const { guid: modelGuid } = asset;
    const { guid: tableAssetGuid } = asset.attributes.sqlAsset;

    await createResource(
      modelGuid,
      "Pull Request on GitHub",
      pull_request.html_url
    );
    await createResource(
      tableAssetGuid,
      "Pull Request on GitHub",
      pull_request.html_url
    );
  });

  const comment = await createCustomComment(
    octokit,
    context,
    `🎊 Congrats on the merge!
  
This pull request has been added as a resource to all the assets modified. ✅
`
  );
  console.log(comment);
}
