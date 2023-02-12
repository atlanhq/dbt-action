export async function getFileContentsFromGithub(octokit, context, filePath) {
    const {repository, pull_request} = context.payload,
        owner = repository.owner.login,
        repo = repository.name,
        head_sha = pull_request.head.sha;

    const res = await octokit.request(
            `GET /repos/${owner}/${repo}/contents/${filePath}?ref=${head_sha}`,
            {
                owner,
                repo,
                path: filePath,
            }
        ),
        buff = Buffer.from(res.data.content, "base64");

    return buff.toString("utf8");
}

export async function getChangedFilesFromGithub(octokit, context) {
    const {repository, pull_request} = context.payload,
        owner = repository.owner.login,
        repo = repository.name,
        pull_number = pull_request.number;

    const res = await octokit.request(
        `GET /repos/${owner}/${repo}/pulls/${pull_number}/files`,
        {
            owner,
            repo,
            pull_number,
        }
    );

    var changedFiles = res.data
        .map(({filename}) => {
            try {
                const [modelName] = filename.match(/.*models\/(.*)\.sql/)[1].split('/').reverse()[0].split('.');

                if (modelName) {
                    return {
                        fileName: modelName,
                        filePath: filename,
                    };
                }
            } catch (e) {

            }
        })
        .filter((i) => i !== undefined)

    changedFiles = changedFiles
        .filter((item, index) => {
            return changedFiles.findIndex(obj => obj.fileName === item.fileName) === index;
        })

    console.log(changedFiles)

    return changedFiles
}

export async function getAssetNameFromGithub({octokit, context, fileName, filePath}) {
    var regExp = /config\(.*alias=\'([^']+)\'.*\)/im;
    var fileContents = await getFileContentsFromGithub(octokit, context, filePath);

    var matches = regExp.exec(fileContents);

    if (matches) {
        return matches[1];
    }

    return fileName;
}

export async function getFileContentsFromGitlab(gitlab, filePath, headSHA) {
    const {CI_PROJECT_PATH} = process.env
    const {content} = await gitlab.RepositoryFiles.show(CI_PROJECT_PATH, filePath, headSHA);
    const buff = Buffer.from(content, "base64")

    return (buff.toString("utf8"))
}

export async function getChangedFilesFromGitlab(gitlab) {
    const {CI_PROJECT_PATH, CI_MERGE_REQUEST_IID} = process.env

    const {changes, diff_refs} = await gitlab.MergeRequests.changes(CI_PROJECT_PATH, CI_MERGE_REQUEST_IID)
    var changedFiles = changes.map(({new_path}) => {
        try {
            const [modelName] = new_path.match(/.*models\/(.*)\.sql/)[1].split('/').reverse()[0].split('.');

            if (modelName) {
                return {
                    fileName: modelName,
                    filePath: new_path,
                    headSHA: diff_refs.head_sha
                };
            }
        } catch (e) {

        }
    }).filter((i) => i !== undefined)

    changedFiles = changedFiles
        .filter((item, index) => {
            return changedFiles.findIndex(obj => obj.fileName === item.fileName) === index;
        })

    console.log(changedFiles)

    return changedFiles
}

export async function getAssetNameFromGitlab({gitlab, fileName, filePath, headSHA}) {
    var regExp = /config\(.*alias=\'([^']+)\'.*\)/im;
    var fileContents = await getFileContentsFromGitlab(gitlab, filePath, headSHA);

    var matches = regExp.exec(fileContents);

    if (matches) {
        return matches[1];
    }

    return fileName;
}