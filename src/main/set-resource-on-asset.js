import {getAsset, createResource} from "../api/index.js";
import {
    createIssueCommentOnGithub,
    getChangedFilesFromGithub,
    getAssetNameFromGithub, getChangedFilesFromGitlab, getAssetNameFromGitlab, createIssueCommentOnGitlab,
} from "../utils/index.js";

export async function setResourceGithub({octokit, context}) {
    const changedFiles = await getChangedFilesFromGithub(octokit, context);
    const {pull_request} = context.payload;
    var totalChangedFiles = 0

    if (changedFiles.length === 0) return;

    for (const {fileName, filePath} of changedFiles) {
        const assetName = await getAssetNameFromGithub({octokit, context, fileName, filePath});
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

    const comment = await createIssueCommentOnGithub(
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

export async function setResourceGitlab({gitlab, web_url}) {
    const changedFiles = await getChangedFilesFromGitlab(gitlab);
    var totalChangedFiles = 0

    if (changedFiles.length === 0) return;

    for (const {fileName, filePath, headSHA} of changedFiles) {
        const assetName = await getAssetNameFromGitlab({gitlab, fileName, filePath, headSHA});
        const asset = await getAsset({name: assetName});

        if (!asset) continue;

        const {guid: modelGuid} = asset;
        const {guid: tableAssetGuid} = asset.attributes.sqlAsset;

        await createResource(
            modelGuid,
            "Pull Request on GitHub",
            web_url
        );
        await createResource(
            tableAssetGuid,
            "Pull Request on GitHub",
            web_url
        );

        totalChangedFiles++
    }

    const comment = await createIssueCommentOnGitlab(
        gitlab,
        `🎊 Congrats on the merge!
  
This pull request has been added as a resource to all the assets modified. ✅
`,
        null,
        true
    );

    return totalChangedFiles
}