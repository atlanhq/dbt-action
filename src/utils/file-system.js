export async function getFileContents(octokit, context, filePath) {
  const { repository, pull_request } = context.payload,
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

export async function getChangedFiles(octokit, context) {
  const { repository, pull_request } = context.payload,
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

  return res.data
    .map(({ filename }) => {
      const fileNameRegEx = /.*\/models\/.*\/(.*)\.sql/gm,
        matches = fileNameRegEx.exec(filename);
      if (matches) {
        return {
          name: matches[1],
          filePath: filename,
        };
      }
    })
    .filter((i) => i !== undefined);
}

export async function getAssetName(octokit, context, fileName, filePath) {
  var regExp = /config\(.*alias=\'([^']+)\'.*\)/im;
  var fileContents = await getFileContents(octokit, context, filePath);
  var matches = regExp.exec(fileContents);

  if (matches) {
    return matches[1];
  }

  return fileName;
}
