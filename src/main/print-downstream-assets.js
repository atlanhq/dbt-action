import {
    getAsset,
    getDownstreamAssets,
    sendSegmentEventOnGithub, sendSegmentEventOnGitlab,
} from "../api/index.js";
import {
    renderDownstreamAssetsComment,
    getChangedFilesFromGithub,
    getAssetNameFromGithub,
    createIssueCommentOnGithub,
    checkCommentExistsOnGithub,
    deleteCommentOnGithub,
    getImageURL,
    getChangedFilesFromGitlab, getAssetNameFromGitlab, createIssueCommentOnGitlab, deleteCommentOnGitlab
} from "../utils/index.js";
import {checkCommentExistsOnGitlab} from "../utils/create-comment.js";

export async function printIAonGithub({octokit, context}) {
    const changedFiles = await getChangedFilesFromGithub(octokit, context);

    let comments = ``;
    let totalChangedFiles = 0;

    for (const {fileName, filePath} of changedFiles) {
        const assetName = await getAssetNameFromGithub({octokit, context, fileName, filePath});
        const asset = await getAsset({name: assetName});

        if (asset.error) {
            comments += asset.error;
            totalChangedFiles++
            continue;
        }

        const {guid} = asset.attributes.sqlAsset;
        const timeStart = Date.now();
        const downstreamAssets = await getDownstreamAssets(asset, guid);

        if (totalChangedFiles !== 0)
            comments += '\n\n---\n\n';

        if (downstreamAssets.error) {
            comments += downstreamAssets.error;
            totalChangedFiles++
            continue;
        }

        sendSegmentEventOnGithub("dbt_ci_action_downstream_unfurl", {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.length,
            total_fetch_time: Date.now() - timeStart,
        });

        const comment = await renderDownstreamAssetsComment(
            asset,
            downstreamAssets
        )

        comments += comment;

        totalChangedFiles++
    }

    comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} ${totalChangedFiles > 1 ? "models" : "model"}** you have edited.    
    
${comments}`

    const existingComment = await checkCommentExistsOnGithub(octokit, context);

    if (totalChangedFiles > 0)
        await createIssueCommentOnGithub(octokit, context, comments, existingComment?.id)

    if (totalChangedFiles === 0 && existingComment)
        await deleteCommentOnGithub(octokit, context, existingComment.id)

    return totalChangedFiles;
}

export async function printIAonGitlab({gitlab}) {
    const changedFiles = await getChangedFilesFromGitlab(gitlab);

    let comments = ``;
    let totalChangedFiles = 0;

    for (const {fileName, filePath, headSHA} of changedFiles) {
        const assetName = await getAssetNameFromGitlab({gitlab, fileName, filePath, headSHA});
        const asset = await getAsset({name: assetName});

        if (asset.error) {
            comments += asset.error;
            totalChangedFiles++
            continue;
        }

        const {guid} = asset.attributes.sqlAsset;
        const timeStart = Date.now();
        const downstreamAssets = await getDownstreamAssets(asset, guid);

        if (totalChangedFiles !== 0)
            comments += '\n\n---\n\n';

        if (downstreamAssets.error) {
            comments += downstreamAssets.error;
            totalChangedFiles++
            continue;
        }

        sendSegmentEventOnGitlab("dbt_ci_action_downstream_unfurl", {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.length,
            total_fetch_time: Date.now() - timeStart,
        });

        const comment = await renderDownstreamAssetsComment(
            asset,
            downstreamAssets
        )

        comments += comment;

        totalChangedFiles++
    }

    comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} ${totalChangedFiles > 1 ? "models" : "model"}** you have edited.

${comments}`

    const existingComment = await checkCommentExistsOnGitlab(gitlab);

    if (totalChangedFiles > 0)
        await createIssueCommentOnGitlab(gitlab, comments, existingComment?.id)

    if (totalChangedFiles === 0 && existingComment)
        await deleteCommentOnGitlab(gitlab, existingComment.id)

    return totalChangedFiles
}