import {getAsset, createResource} from "../api/index.js";
import {
    createIssueComment,
    getChangedFiles,
    getAssetName,
} from "../utils/index.js";

export default async function setResourceOnAsset({octokit, context}) {
    const changedFiles = await getChangedFiles(octokit, context);
    const {pull_request} = context.payload;
    var totalChangedFiles = 0

    if (changedFiles.length === 0) return;

    for (const {fileName, filePath} of changedFiles) {
        const assetName = await getAssetName({octokit, context, fileName, filePath});
        const asset = await getAsset({name: assetName});

        if (!asset) continue;

        const {guid: modelGuid} = asset;
        const {guid: tableAssetGuid} = asset.attributes.sqlAsset;

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

        totalChangedFiles++
    }

    const comment = await createIssueComment(
        octokit,
        context,
        `🎊 Congrats on the merge!
  
This pull request has been added as a resource to all the assets modified. ✅
`,
        null,
        true
    );

    return totalChangedFiles
}
