import dotenv from "dotenv";
import core from "@actions/core";
import github from "@actions/github";
import getAsset from "./api/get-asset.js";
import getDownstreamAssets from "./api/get-downstream-assets.js";
import {
  getConnectorImage,
  getCertificationImage,
  getImageURL,
} from "./utils/get-image-url.js";

dotenv.config();

const { IS_DEV } = process.env;
const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;
const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;

async function getFileContents(octokit, context, filePath) {
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

async function getChangedFiles(octokit, context) {
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

async function getAssetName(octokit, context, fileName, filePath) {
  var regExp = /config\(.*alias=\'([^']+)\'.*\)/im;
  var fileContents = await getFileContents(octokit, context, filePath);
  var matches = regExp.exec(fileContents);

  if (matches) {
    return matches[1];
  }

  return fileName;
}

async function createComment(octokit, context, asset, downstreamAssets) {
  const { pull_request } = context.payload;

  const rows = downstreamAssets.map(
    ({ displayText, guid, typeName, attributes, meaningNames }) => {
      const connectorImage = getConnectorImage(attributes.connectorName),
        certificationImage = attributes?.certificateStatus
          ? getCertificationImage(attributes?.certificateStatus)
          : "",
        readableTypeName = typeName
          .toLowerCase()
          .replace(attributes.connectorName, "")
          .toUpperCase();

      return [
        `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}) ${certificationImage}`,
        `\`${readableTypeName}\``,
        attributes?.userDescription || attributes?.description || "--",
        attributes?.ownerUsers?.join(", ") || "--",
        meaningNames?.join(", ") || "--",
      ];
    }
  );

  const comment = `
## ${getConnectorImage(asset.attributes.connectorName)} [${
    asset.displayText
  }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}) ${
    asset.attributes?.certificateStatus
      ? getCertificationImage(asset.attributes.certificateStatus)
      : ""
  }
\`${asset.typeName
    .toLowerCase()
    .replace(asset.attributes.connectorName, "")
    .toUpperCase()}\`
      
There are ${downstreamAssets.length} downstream asset(s).
Name | Type | Description | Owners | Terms
--- | --- | --- | --- | ---
${rows.map((row) => row.join(" | ")).join("\n")}

${getImageURL(
  "atlan-logo"
)} [View asset on Atlan.](${ATLAN_INSTANCE_URL}/assets/${asset.guid})`;

  const commentObj = {
    ...context.repo,
    issue_number: pull_request.number,
    body: comment,
  };

  if (IS_DEV) return comment;
  return octokit.rest.issues.createComment(commentObj);
}

async function run() {
  const { context = {} } = github;
  const octokit = github.getOctokit(GITHUB_TOKEN);

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

run().catch((e) => core.setFailed(e.message));
