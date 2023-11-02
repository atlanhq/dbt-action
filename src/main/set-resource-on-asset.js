import { getAsset, createResource, getDownstreamAssets } from "../api/index.js";
import {
  createIssueComment,
  getChangedFiles,
  getAssetName,
  getInstanceUrl,
  getConnectorImage,
} from "../utils/index.js";

const ATLAN_INSTANCE_URL =
  getInstanceUrl();

export default async function setResourceOnAsset({ octokit, context }) {
  const changedFiles = await getChangedFiles(octokit, context);
  const { pull_request } = context.payload;
  let tableMd = ``;
  let setResourceFailed = false

  if (changedFiles.length === 0) return;

  const totalModifiedFiles = changedFiles.filter(
    (i) => i.status === "modified"
  ).length;

  for (const { fileName, filePath } of changedFiles) {
    const assetName = await getAssetName({
      octokit,
      context,
      fileName,
      filePath,
    });
    const asset = await getAsset({ name: assetName });

    if (asset.error) continue;

    const model = asset;
    const materialisedView = asset?.attributes?.dbtModelSqlAssets?.[0];

    if(!materialisedView) continue;

    const downstreamAssets = await getDownstreamAssets(
      asset,
      materialisedView.guid,
      totalModifiedFiles
    );

    if(!downstreamAssets?.entities?.length) continue;

    if (model) {
      const { guid: modelGuid } = model
      const resp = await createResource(
        modelGuid,
        pull_request.title,
        pull_request.html_url
      );
      const md = `${getConnectorImage(model.attributes.connectorName)} [${
        model.displayText
      }](${ATLAN_INSTANCE_URL}/assets/${model.guid}/overview?utm_source=dbt_github_action)`

      tableMd += `${md} | ${resp ? '✅' : '❌'} \n`;

      if(!resp) setResourceFailed = true
    }

    if (materialisedView) {
      const { guid: tableAssetGuid } = materialisedView
      const resp = await createResource(
        tableAssetGuid,
        "Pull Request on GitHub",
        pull_request.html_url
      );
      const md = `${getConnectorImage(materialisedView.attributes.connectorName)} [${
        materialisedView.attributes.name
      }](${ATLAN_INSTANCE_URL}/assets/${materialisedView.guid}/overview?utm_source=dbt_github_action)`

      tableMd += `${md} | ${resp ? '✅' : '❌'}\n`;

      if(!resp) setResourceFailed = true
    }
  }

  if(!tableMd) {
    console.log("No assets have downstream assets.")
    return totalModifiedFiles;
  }

  const comment = await createIssueComment(
    octokit,
    context,
    `## 🎊 Congrats on the merge!
  
This pull request has been added as a resource to the following assets:

${setResourceFailed ? '> ⚠️  Seems like we were unable to set the resources for some of the assets due to insufficient permissions. To ensure that the pull request is linked as a resource, you will need to assign the right persona with requisite permissions to the API token.' : ''}

Name | Resource set successfully
--- | ---
${tableMd}
`,
    null,
    true
  );

  return totalModifiedFiles;
}
