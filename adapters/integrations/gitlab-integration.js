// gitlabIntegration.js
import dotenv from "dotenv";

import IntegrationInterface from "./contract/contract.js";
import { Gitlab } from "@gitbeaker/node";
import {
  createResource,
  getAsset,
  getDownstreamAssets,
  sendSegmentEvent,
} from "../../src/api/index.js";
import { getImageURL, auth } from "../../src/utils/index.js";

dotenv.config();

export default class GitLabIntegration extends IntegrationInterface {
  constructor(token) {
    super(token);
  }

  async run() {
    console.log("Run Gitlab");
    const timeStart = Date.now();

    const gitlab = new Gitlab({
      host: "https://gitlab.com",
      token: this.token,
    });

    const { CI_PROJECT_PATH, CI_MERGE_REQUEST_IID } = process.env;

    if (!(await this.authIntegration({ gitlab })))
      throw { message: "Wrong API Token" };

    const { state, web_url } = await gitlab.MergeRequests.show(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID
    );

    let total_assets = 0;

    if (state === "opened") {
      total_assets = await this.printDownstreamAssets({ gitlab });
    } else if (state === "merged") {
      total_assets = await this.setResourceOnAsset({ gitlab, web_url });
    }

    if (total_assets !== 0)
      this.sendSegmentEventOfIntegration("dbt_ci_action_run", {
        asset_count: total_assets,
        total_time: Date.now() - timeStart,
      });
  }

  async printDownstreamAssets({ gitlab }) {
    // Implementation for printing impact on GitHub
    // Use this.token to access the token
    const changedFiles = await this.getChangedFiles({ gitlab }); //Complete

    let comments = ``;
    let totalChangedFiles = 0;

    for (const { fileName, filePath, headSHA } of changedFiles) {
      const assetName = await this.getAssetName({
        //Complete
        gitlab,
        fileName,
        filePath,
        headSHA,
      });
      const asset = await getAsset({
        //Incomplete
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
        //Incomplete
        asset,
        guid,
        this.sendSegmentEventOfIntegration,
        "gitlab"
      );

      if (totalChangedFiles !== 0) comments += "\n\n---\n\n";

      if (downstreamAssets.error) {
        comments += downstreamAssets.error;
        totalChangedFiles++;
        continue;
      }

      this.sendSegmentEventOfIntegration("dbt_ci_action_downstream_unfurl", {
        //Complete
        asset_guid: asset.guid,
        asset_type: asset.typeName,
        downstream_count: downstreamAssets.length,
        total_fetch_time: Date.now() - timeStart,
      });

      const comment = await this.renderDownstreamAssetsComment({
        //Complete
        asset,
        downstreamAssets,
      });

      comments += comment;

      totalChangedFiles++;
    }

    comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} ${
      totalChangedFiles > 1 ? "models" : "model"
    }** you have edited.

${comments}`;

    const existingComment = await this.checkCommentExists({ gitlab }); //Complete

    if (totalChangedFiles > 0)
      await this.createIssueComment({
        //Complete
        gitlab,
        comments,
        comment_id: existingComment?.id,
      });

    if (totalChangedFiles === 0 && existingComment)
      await this.deleteComment({ gitlab, comment_id: existingComment.id }); //Complete

    return totalChangedFiles;
  }

  async setResourceOnAsset({ gitlab, web_url }) {
    // Implementation for setting resources on GitHub
    // Use this.token to access the token
    const changedFiles = await this.getChangedFiles({ gitlab });
    var totalChangedFiles = 0;

    if (changedFiles.length === 0) return;

    for (const { fileName, filePath, headSHA } of changedFiles) {
      const assetName = await this.getAssetName({
        gitlab,
        fileName,
        filePath,
        headSHA,
      });
      const asset = await getAsset({
        //Incomplete
        name: assetName,
        sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
      });

      if (!asset) continue;

      const { guid: modelGuid } = asset;
      const { guid: tableAssetGuid } = asset.attributes.sqlAsset;

      await createResource(
        //Complete
        modelGuid,
        "Pull Request on GitLab",
        web_url,
        this.sendSegmentEventOfIntegration
      );
      await createResource(
        tableAssetGuid,
        "Pull Request on GitLab",
        web_url,
        this.sendSegmentEventOfIntegration
      );

      totalChangedFiles++;
    }

    const comment = await this.createIssueComment({
      //Complete
      gitlab,
      content: `🎊 Congrats on the merge!
  
This pull request has been added as a resource to all the assets modified. ✅
`,
      comment_id: null,
      forceNewComment: true,
    });

    return totalChangedFiles;
  }

  async authIntegration({ gitlab }) {
    //Incomplete
    // Implement your auth logic here
    // IMPORT ATLAN INSTANCE URL
    const response = await auth();
    // Inside this if condition check github secrets is mentioned
    if (response?.status === 401) {
      await this.createIssueComment(
        gitlab,
        `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`
      );
      return false;
    }

    if (response === undefined) {
      await this.createIssueComment(
        gitlab,
        `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`
      );
      return false;
    }

    return true;
  }

  async createIssueComment({
    //Complete
    gitlab,
    content,
    comment_id = null,
    forceNewComment = false,
  }) {
    const { CI_PROJECT_PATH, CI_MERGE_REQUEST_IID } = process.env;

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`;

    console.log(content);

    if (IS_DEV) return content;

    if (comment_id && !forceNewComment)
      return await gitlab.MergeRequestNotes.edit(
        CI_PROJECT_PATH,
        CI_MERGE_REQUEST_IID,
        comment_id,
        content
      );
    return await gitlab.MergeRequestNotes.create(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID,
      content
    );
  }

  async sendSegmentEventOfIntegration({ action, properties }) {
    //Complete
    // Implement your sendSegmentEvent logic here
    // IMPORT ATLAN_INSTANCE_URL.
    const domain = new URL(ATLAN_INSTANCE_URL).hostname;
    const { CI_PROJECT_PATH, CI_JOB_URL } = process.env;

    const raw = stringify({
      category: "integration",
      object: "gitlab",
      action,
      userId: "atlan-annonymous-github",
      properties: {
        ...properties,
        gitlab_job_id: CI_JOB_URL,
        domain,
      },
    });
    // IMPORT SEGMENTEVENT
    return sendSegmentEvent(action, raw);
  }

  async getChangedFiles({ gitlab }) {
    //Complete
    const { CI_PROJECT_PATH, CI_MERGE_REQUEST_IID } = process.env;

    const { changes, diff_refs } = await gitlab.MergeRequests.changes(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID
    );
    var changedFiles = changes
      .map(({ new_path }) => {
        try {
          const [modelName] = new_path
            .match(/.*models\/(.*)\.sql/)[1]
            .split("/")
            .reverse()[0]
            .split(".");

          if (modelName) {
            return {
              fileName: modelName,
              filePath: new_path,
              headSHA: diff_refs.head_sha,
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

    console.log(changedFiles);

    return changedFiles;
  }

  async getAssetName({ gitlab, fileName, filePath, headSHA }) {
    //Complete
    var regExp = /config\(.*alias=\'([^']+)\'.*\)/im;
    var fileContents = await this.getFileContents({
      gitlab,
      filePath,
      headSHA,
    });

    var matches = regExp.exec(fileContents);

    if (matches) {
      return matches[1];
    }

    return fileName;
  }

  async getFileContents({ gitlab, filePath, headSHA }) {
    //Complete
    const { CI_PROJECT_PATH } = process.env;
    const { content } = await gitlab.RepositoryFiles.show(
      CI_PROJECT_PATH,
      filePath,
      headSHA
    );
    const buff = Buffer.from(content, "base64");

    return buff.toString("utf8");
  }

  async checkCommentExists({ gitlab }) {
    //Complete
    const { CI_PROJECT_PATH, CI_MERGE_REQUEST_IID } = process.env;
    if (IS_DEV) return null;

    const comments = await gitlab.MergeRequestNotes.all(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID
    );

    return comments.find(
      // Why here we have hardocded value? What should be over here inplace of this.
      (comment) =>
        comment.author.username === "Jaagrav" &&
        comment.body.includes(
          "<!-- ActionCommentIdentifier: atlan-dbt-action -->"
        )
    );
  }

  async deleteComment({ gitlab, comment_id }) {
    //Complete
    const { CI_PROJECT_PATH, CI_MERGE_REQUEST_IID } = process.env;

    return await gitlab.MergeRequestNotes.remove(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID,
      comment_id
    );
  }

  async renderDownstreamAssetsComment({ asset, downstreamAssets }) {
    let impactedData = downstreamAssets.map(
      ({ displayText, guid, typeName, attributes, meanings }) => {
        let readableTypeName = typeName
          .toLowerCase()
          .replace(attributes.connectorName, "")
          .toUpperCase();
        readableTypeName =
          readableTypeName.charAt(0).toUpperCase() +
          readableTypeName.slice(1).toLowerCase();
        return [
          guid,
          displayText,
          attributes.connectorName,
          readableTypeName,
          attributes?.userDescription || attributes?.description || "",
          attributes?.certificateStatus || "",
          [...attributes?.ownerUsers, ...attributes?.ownerGroups] || [],
          meanings
            .map(
              ({ displayText, termGuid }) =>
                `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}?utm_source=dbt_gitlab_action)`
            )
            ?.join(", ") || " ",
          attributes?.sourceURL || "",
        ];
      }
    );

    impactedData = impactedData.sort((a, b) => a[3].localeCompare(b[3])); // Sort by typeName
    impactedData = impactedData.sort((a, b) => a[2].localeCompare(b[2])); // Sort by connectorName

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
        sourceUrl,
      ]) => {
        const connectorImage = getConnectorImage(connectorName),
          certificationImage = certificateStatus
            ? getCertificationImage(certificateStatus)
            : "";

        return [
          `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}?utm_source=dbt_gitlab_action) ${certificationImage}`,
          `\`${typeName}\``,
          description,
          owners.join(", ") || " ",
          meanings,
          sourceUrl ? `[Open in ${connectorName}](${sourceUrl})` : " ",
        ];
      }
    );

    const comment = `### ${getConnectorImage(
      asset.attributes.connectorName
    )} [${asset.displayText}](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }?utm_source=dbt_gitlab_action) ${
      asset.attributes?.certificateStatus
        ? getCertificationImage(asset.attributes.certificateStatus)
        : ""
    }
          
    **${downstreamAssets.length} downstream assets** 👇
    Name | Type | Description | Owners | Terms | Source URL
    --- | --- | --- | --- | --- | ---
    ${rows
      .map((row) =>
        row.map((i) => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")
      )
      .join("\n")}
    
    ${getImageURL(
      "atlan-logo",
      15,
      15
    )} [View asset in Atlan](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }?utm_source=dbt_gitlab_action)`;

    return comment;
  }
}
