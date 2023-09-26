// githubIntegration.js
import dotenv from "dotenv"; // Check do we actually need it or not
import IntegrationInterface from "./contract/contract.js";
import github from "@actions/github";
import {
  getAsset,
  getDownstreamAssets,
  sendSegmentEvent,
  createResource,
} from "../../src/api/index.js";
import {
  renderDownstreamAssetsComment,
  getImageURL,
  auth,
} from "../../src/utils/index.js";

dotenv.config();

export default class GitHubIntegration extends IntegrationInterface {
  constructor(token) {
    super(token);
  }

  async run() {
    console.log("Run Github");
    const timeStart = Date.now();
    const { context } = github;
    const octokit = github.getOctokit(this.token);
    const { pull_request } = context.payload;
    const { state, merged } = pull_request;

    if (!(await this.authIntegration({ octokit, context }))) {
      throw { message: "Wrong API Token" };
    }

    let total_assets = 0;

    if (state === "open") {
      total_assets = await this.printDownstreamAssets({ octokit, context });
    } else if (state === "closed" && merged) {
      total_assets = await this.setResourceOnAsset({ octokit, context });
    }

    if (total_assets !== 0) {
      this.sendSegmentEventOfIntegration("dbt_ci_action_run", {
        asset_count: total_assets,
        total_time: Date.now() - timeStart,
      });
    }
  }

  async printDownstreamAssets({ octokit, context }) {
    // Implementation for printing impact on GitHub
    // Use this.token to access the token

    const changedFiles = await this.getChangedFiles({ octokit, context }); // Complete

    let comments = ``;
    let totalChangedFiles = 0;

    for (const { fileName, filePath } of changedFiles) {
      const assetName = await this.getAssetName({
        // Complete
        octokit,
        context,
        fileName,
        filePath,
      });
      const asset = await getAsset({
        //Complete
        name: assetName,
        sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
      });
      // TODO :- When we call getAsset we are always sending segment event to github. We have to resolve this.
      // Either we can pass that function to getAsset function to resolve this. Or check for better alternatives.
      // If we pass the function we can simply write getAsset({name: assetName}, this.sendSegmentEvent)

      if (asset.error) {
        comments += asset.error;
        totalChangedFiles++;
        continue;
      }

      const { guid } = asset.attributes.sqlAsset;
      const timeStart = Date.now();
      const downstreamAssets = await getDownstreamAssets(
        //Complete
        asset,
        guid,
        this.sendSegmentEventOfIntegration,
        "github"
      );

      if (totalChangedFiles !== 0) comments += "\n\n---\n\n";

      if (downstreamAssets.error) {
        comments += downstreamAssets.error;
        totalChangedFiles++;
        continue;
      }

      this.sendSegmentEventOfIntegration("dbt_ci_action_downstream_unfurl", {
        asset_guid: asset.guid,
        asset_type: asset.typeName,
        downstream_count: downstreamAssets.length,
        total_fetch_time: Date.now() - timeStart,
      });
      // WHICH CODE TO PICKUP ONE IN THE BETA OR IN THE GITLAB BRANCH
      const comment = await this.renderDownstreamAssetsComment({
        octokit,
        context,
        asset,
        materialisedAsset,
        downstreamAssets,
        classifications,
      });

      comments += comment;

      totalChangedFiles++;
    }

    comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} ${
      totalChangedFiles > 1 ? "models" : "model"
    }** you have edited.    
    
${comments}`;

    const existingComment = await this.checkCommentExists({ octokit, context });

    if (totalChangedFiles > 0) {
      await this.createIssueComment({
        octokit,
        context,
        content: comments,
        comment_id: existingComment?.id,
      });
    }

    if (totalChangedFiles === 0 && existingComment)
      await this.deleteComment({
        octokit,
        context,
        comment_id: existingComment.id,
      });

    return totalChangedFiles;
  }

  async setResourceOnAsset({ octokit, context }) {
    //COMPLETE
    // Implementation for setting resources on GitHub
    // Use this.token to access the token

    const changedFiles = await this.getChangedFiles({ octokit, context });
    const { pull_request } = context.payload;
    var totalChangedFiles = 0;

    if (changedFiles.length === 0) return;

    for (const { fileName, filePath } of changedFiles) {
      const assetName = await this.getAssetName({
        //Complete
        octokit,
        context,
        fileName,
        filePath,
      });
      const asset = await getAsset({
        name: assetName,
        sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
      });

      if (!asset) continue;

      const { guid: modelGuid } = asset;
      const { guid: tableAssetGuid } = asset.attributes.sqlAsset;

      await createResource(
        modelGuid,
        "Pull Request on GitHub",
        pull_request.html_url,
        this.sendSegmentEventOfIntegration
      );
      await createResource(
        tableAssetGuid,
        "Pull Request on GitHub",
        pull_request.html_url,
        this.sendSegmentEventOfIntegration
      );

      totalChangedFiles++;
    }

    const comment = await this.createIssueComment({
      octokit,
      context,
      content: `🎊 Congrats on the merge!
  
This pull request has been added as a resource to all the assets modified. ✅
`,
      comment_id: null,
      forceNewComment: true,
    });

    return totalChangedFiles;
  }

  async authIntegration({ octokit, context }) {
    //COMPLETE
    // IMPORT ATLAN INSTANCE
    // Implement your auth logic here
    const response = await auth();
    // Need to change the route we are passing in createIssueComment.
    const existingComment = await checkCommentExists(octokit, context);

    console.log("Existing Comment", existingComment);

    if (response?.status === 401) {
      await this.createIssueComment(
        // Check how u are calling this createIssueComment function
        octokit,
        context,
        `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`,
        existingComment?.id
      );
      return false;
    }

    if (response === undefined) {
      await this.createIssueComment(
        octokit,
        context,
        `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`,
        existingComment?.id
      );
      return false;
    }

    return true;
  }

  async sendSegmentEventOfIntegration({ action, properties }) {
    //COMPLETE
    // Implement your sendSegmentEvent logic here
    // IMPORT ATLAN_INSTANCE_URL.
    const domain = new URL(ATLAN_INSTANCE_URL).hostname;

    const raw = stringify({
      category: "integration",
      object: "github",
      action,
      userId: "atlan-annonymous-github",
      properties: {
        ...properties,
        github_action_id: `https://github.com/${context.payload.repository.full_name}/actions/runs/${context.runId}`,
        domain,
      },
    });

    return sendSegmentEvent(action, raw);
  }

  async getChangedFiles({ octokit, context }) {
    //Complete
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

    var changedFiles = res.data
      .map(({ filename, status }) => {
        try {
          const [modelName] = filename
            .match(/.*models\/(.*)\.sql/)[1]
            .split("/")
            .reverse()[0]
            .split(".");

          if (modelName) {
            return {
              fileName: modelName,
              filePath: filename,
              status,
            };
          }
        } catch (e) {}
      })
      .filter((i) => i !== undefined);

    changedFiles = changedFiles.filter((item, index) => {
      return (
        changedFiles.findIndex((obj) => obj.fileName === item.fileName) ===
        index
      );
    });

    console.log("Changed Files: ", changedFiles);

    return changedFiles;
  }

  async getAssetName({ octokit, context, fileName, filePath }) {
    // Complete
    var regExp =
      /{{\s*config\s*\(\s*(?:[^,]*,)*\s*alias\s*=\s*['"]([^'"]+)['"](?:\s*,[^,]*)*\s*\)\s*}}/im;
    var fileContents = await this.getFileContents(octokit, context, filePath);

    if (fileContents) {
      var matches = regExp.exec(fileContents);

      if (matches) {
        return matches[1].trim();
      }
    }

    return fileName;
  }

  async getFileContents({ octokit, context, filePath }) {
    // Complete
    const { repository, pull_request } = context.payload,
      owner = repository.owner.login,
      repo = repository.name,
      head_sha = pull_request.head.sha;

    const res = await octokit
      .request(
        `GET /repos/${owner}/${repo}/contents/${filePath}?ref=${head_sha}`,
        {
          owner,
          repo,
          path: filePath,
        }
      )
      .catch((e) => {
        console.log("Error fetching file contents: ", e);
        return null;
      });

    if (!res) return null;

    const buff = Buffer.from(res.data.content, "base64");

    return buff.toString("utf8");
  }

  async checkCommentExists({ octokit, context }) {
    //COMPLETE
    if (IS_DEV) return null;

    const { pull_request } = context.payload;

    const comments = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_request.number,
    });

    return comments.data.find(
      (comment) =>
        comment.user.login === "github-actions[bot]" &&
        comment.body.includes(
          "<!-- ActionCommentIdentifier: atlan-dbt-action -->"
        )
    );
  }

  async createIssueComment({
    // COMPLETE
    octokit,
    context,
    content,
    comment_id = null,
    forceNewComment = false,
  }) {
    const { pull_request } = context.payload;

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`;

    const commentObj = {
      ...context.repo,
      issue_number: pull_request.number,
      body: content,
    };

    console.log(content);

    if (IS_DEV) return content;

    if (comment_id && !forceNewComment)
      return octokit.rest.issues.updateComment({ ...commentObj, comment_id });
    return octokit.rest.issues.createComment(commentObj);
  }

  async deleteComment({ octokit, context, comment_id }) {
    //COMPLETE
    const { pull_request } = context.payload;

    return octokit.rest.issues.deleteComment({
      ...context.repo,
      issue_number: pull_request.number,
      comment_id,
    });
  }

  async renderDownstreamAssetsComment({
    octokit,
    context,
    asset,
    materialisedAsset,
    downstreamAssets,
    classifications,
  }) {
    let impactedData = downstreamAssets.entities.map(
      ({
        displayText,
        guid,
        typeName,
        attributes,
        meanings,
        classificationNames,
      }) => {
        // Modifying the typeName and getting the readableTypeName
        let readableTypeName = typeName
          .toLowerCase()
          .replace(attributes.connectorName, "")
          .toUpperCase();

        // Filtering classifications based on classificationNames
        let classificationsObj = classifications.filter(({ name }) =>
          classificationNames.includes(name)
        );

        // Modifying the readableTypeName
        readableTypeName =
          readableTypeName.charAt(0).toUpperCase() +
          readableTypeName.slice(1).toLowerCase();

        return [
          guid,
          truncate(displayText),
          truncate(attributes.connectorName),
          truncate(readableTypeName),
          truncate(
            attributes?.userDescription || attributes?.description || ""
          ),
          attributes?.certificateStatus || "",
          truncate(
            [...attributes?.ownerUsers, ...attributes?.ownerGroups] || []
          ),
          truncate(
            meanings.map(
              ({ displayText, termGuid }) =>
                `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}/overview?utm_source=dbt_github_action)`
            )
          ),
          truncate(
            classificationsObj?.map(
              ({ name, displayName }) => `\`${displayName}\``
            )
          ),
          attributes?.sourceURL || "",
        ];
      }
    );

    // Sorting the impactedData first by typeName and then by connectorName
    impactedData = impactedData.sort((a, b) => a[3].localeCompare(b[3]));
    impactedData = impactedData.sort((a, b) => a[2].localeCompare(b[2]));

    // Creating rows for the downstream table
    let rows = impactedData.map(
      ([
        guid,
        displayText,
        connectorName,
        typeName,
        description,
        certificateStatus,
        owners,
        meanings,
        classifications,
        sourceUrl,
      ]) => {
        // Getting connector and certification images
        const connectorImage = getConnectorImage(connectorName);
        const certificationImage = certificateStatus
          ? getCertificationImage(certificateStatus)
          : "";

        return [
          `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}/overview?utm_source=dbt_github_action) ${certificationImage}`,
          `\`${typeName}\``,
          description,
          owners,
          meanings,
          classifications,
          sourceUrl ? `[Open in ${connectorName}](${sourceUrl})` : " ",
        ];
      }
    );

    const environmentName =
      materialisedAsset?.attributes?.assetDbtEnvironmentName;
    const projectName = materialisedAsset?.attributes?.assetDbtProjectName;
    // Generating asset information
    const assetInfo = `### ${getConnectorImage(
      asset.attributes.connectorName
    )} [${asset.displayText}](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }/overview?utm_source=dbt_github_action) ${
      asset.attributes?.certificateStatus
        ? getCertificationImage(asset.attributes.certificateStatus)
        : ""
    }
Materialised asset: ${getConnectorImage(
      materialisedAsset.attributes.connectorName
    )} [${materialisedAsset.attributes.name}](${ATLAN_INSTANCE_URL}/assets/${
      materialisedAsset.guid
    }/overview?utm_source=dbt_github_action) ${
      materialisedAsset.attributes?.certificateStatus
        ? getCertificationImage(materialisedAsset.attributes.certificateStatus)
        : ""
    }${environmentName ? ` | Environment Name: \`${environmentName}\`` : ""}${
      projectName ? ` | Project Name: \`${projectName}\`` : ""
    }`;

    // Generating the downstream table
    const downstreamTable = `<details><summary><b>${
      downstreamAssets.entityCount
    } downstream assets 👇</b></summary><br/>

Name | Type | Description | Owners | Terms | Classifications | Source URL
--- | --- | --- | --- | --- | --- | ---       
${rows
  .map((row) =>
    row.map((i) => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")
  )
  .join("\n")}

${
  downstreamAssets.hasMore
    ? `[See more downstream assets at Atlan](${ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/lineage?utm_source=dbt_github_action)`
    : ""
}

</details>`;

    // Generating the "View asset in Atlan" button
    const viewAssetButton = `${getImageURL(
      "atlan-logo",
      15,
      15
    )} [View asset in Atlan](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }/overview?utm_source=dbt_github_action)`;

    // Generating the final comment based on the presence of downstream assets
    if (downstreamAssets.entities.length > 0) {
      return `${assetInfo}
      
${downstreamTable}

${viewAssetButton}`;
    } else {
      return `${assetInfo}
      
No downstream assets found.

${viewAssetButton}`;
    }
  }
}
