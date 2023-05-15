export async function getFileContents(octokit, context, filePath) {
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
    ).catch(e => {
        console.log("Error fetching file contents: ", e)
        return null
    });

    if (!res) return null

    const buff = Buffer.from(res.data.content, "base64");

    return buff.toString("utf8");
}

export async function getChangedFiles(octokit, context) {
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
        .map(({filename, status}) => {
            try {
                const [modelName] = filename.match(/.*models\/(.*)\.sql/)[1].split('/').reverse()[0].split('.');

                if (modelName) {
                    return {
                        fileName: modelName,
                        filePath: filename,
                        status
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

    console.log("Changed Files: ", changedFiles)

    return changedFiles
}

export async function getAssetName({octokit, context, fileName, filePath}) {
    var regExp = /{{\s*config\s*\(\s*(?:[^,]*,)*\s*alias\s*=\s*['"]([^'"]+)['"](?:\s*,[^,]*)*\s*\)\s*}}/im;
    var fileContents = await getFileContents(octokit, context, filePath);

    if (fileContents) {
        var matches = regExp.exec(fileContents);

        if (matches) {
            return matches[1].trim();
        }
    }

    return fileName;
}
