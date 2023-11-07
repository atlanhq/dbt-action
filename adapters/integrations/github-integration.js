// githubIntegration.js
import IntegrationInterface from "./contract/contract.js";
import github from "@actions/github";
import stringify from "json-stringify-safe";
import {
  getCertificationImage,
  getConnectorImage,
  getEnvironments,
  auth,
  truncate,
} from "../utils/index.js";
import {
  getAsset,
  getDownstreamAssets,
  sendSegmentEvent,
  createResource,
  getClassifications,
} from "../api/index.js";
import {
  getSetResourceOnAssetComment,
  getErrorResponseStatus401,
  getErrorResponseStatusUndefined,
  getAssetInfo,
  getDownstreamTable,
  getViewAssetButton,
  getMDCommentForModel,
  getMDCommentForMaterialisedView,
  getTableMD,
} from "../templates/github-integration.js";
import { getNewModelAddedComment, getBaseComment } from "../templates/atlan.js";
import {
  IS_DEV,
  ATLAN_INSTANCE_URL,
  IGNORE_MODEL_ALIAS_MATCHING,
} from "../utils/get-environment-variables.js";
import logger from "../logger/logger.js";
var headSHA;
const integrationName = "github";
export default class GitHubIntegration extends IntegrationInterface {
  constructor(token) {
    super(token);
  }

  async run() {
    try {
      const timeStart = Date.now();
      const { context } = github;

      const octokit = github.getOctokit(this.token);
      const { pull_request } = context?.payload;
      const { state, merged } = pull_request;
      headSHA = pull_request?.head?.sha;

      logger.withInfo(
        "GitHub Integration is running...",
        integrationName,
        headSHA,
        "run"
      );

      if (!(await this.authIntegration({ octokit, context }))) {
        logger.withError(
          "Authentication failed. Wrong API Token.",
          integrationName,
          headSHA,
          "run"
        );
        throw { message: "Wrong API Token" };
      }

      let total_assets = 0;

      if (state === "open") {
        total_assets = await this.printDownstreamAssets({ octokit, context });
      } else if (state === "closed" && merged) {
        total_assets = await this.setResourceOnAsset({ octokit, context });
      }

      if (total_assets !== 0) {
        this.sendSegmentEventOfIntegration({
          action: "dbt_ci_action_run",
          properties: {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
          },
        });
      }

      logger.withInfo(
        "Successfully Completed DBT_CI_ACTION",
        integrationName,
        headSHA,
        "run"
      );
    } catch (error) {
      logger.withError(
        `Error in run(): ${error.message}`,
        integrationName,
        headSHA,
        "run"
      );
      throw error;
    }
  }

  async printDownstreamAssets({ octokit, context }) {
    logger.withInfo(
      "Printing downstream assets...",
      integrationName,
      headSHA,
      "printDownstreamAssets"
    );

    try {
      const changedFiles = await this.getChangedFiles({ octokit, context });
      let comments = ``;
      let totalChangedFiles = 0;

      for (const { fileName, filePath, status } of changedFiles) {
        logger.withInfo(
          `Processing file: ${fileName}`,
          integrationName,
          headSHA,
          "printDownstreamAssets"
        );
        const aliasName = await this.getAssetName({
          octokit,
          context,
          fileName,
          filePath,
        });
        const assetName = IGNORE_MODEL_ALIAS_MATCHING ? fileName : aliasName;

        const environments = getEnvironments();
        let environment = null;
        for (const [baseBranchName, environmentName] of environments) {
          if (baseBranchName === context.payload.pull_request.base.ref) {
            environment = environmentName;
            break;
          }
        }

        logger.withInfo(
          `Processing asset: ${assetName} in environment: ${environment}`,
          integrationName,
          headSHA,
          "printDownstreamAssets"
        );
        const asset = await getAsset({
          name: assetName,
          sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
          environment: environment,
          integration: "github",
        });

        if (totalChangedFiles !== 0) comments += "\n\n---\n\n";

        if (status === "added") {
          logger.withInfo(
            `New model added: ${fileName}`,
            integrationName,
            headSHA,
            "printDownstreamAssets"
          );
          comments += getNewModelAddedComment(fileName);
          totalChangedFiles++;
          continue;
        }

        if (asset.error) {
          logger.withError(
            `Asset error for ${assetName}: ${asset.error}`,
            integrationName,
            headSHA,
            "printDownstreamAssets"
          );
          comments += asset.error;
          totalChangedFiles++;
          continue;
        }

        const materialisedAsset = asset?.attributes?.dbtModelSqlAssets?.[0];
        const timeStart = Date.now();

        const totalModifiedFiles = changedFiles.filter(
          (i) => i.status === "modified"
        ).length;

        const downstreamAssets = await getDownstreamAssets(
          asset,
          materialisedAsset.guid,
          totalModifiedFiles,
          this.sendSegmentEventOfIntegration,
          "github"
        );

        if (downstreamAssets.error) {
          logger.withError(
            `Downstream assets error for ${assetName}: ${downstreamAssets.error}`,
            integrationName,
            headSHA,
            "printDownstreamAssets"
          );
          comments += downstreamAssets.error;
          totalChangedFiles++;
          continue;
        }

        this.sendSegmentEventOfIntegration({
          action: "dbt_ci_action_downstream_unfurl",
          properties: {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.entities.length,
            total_fetch_time: Date.now() - timeStart,
          },
        });

        const classifications = await getClassifications({
          sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
        });

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

      comments = getBaseComment(totalChangedFiles, comments);

      const existingComment = await this.checkCommentExists({
        octokit,
        context,
      });

      logger.withInfo(
        `Existing Comment: ${existingComment?.id}`,
        integrationName,
        headSHA,
        "printDownstreamAssets"
      );

      if (totalChangedFiles > 0)
        await this.createIssueComment({
          octokit,
          context,
          content: comments,
          comment_id: existingComment?.id,
        });

      if (totalChangedFiles === 0 && existingComment)
        await this.deleteComment({
          octokit,
          context,
          comment_id: existingComment?.id,
        });

      logger.withInfo(
        "Successfully printed Downstream Assets",
        integrationName,
        headSHA,
        "printDownstreamAssets"
      );

      return totalChangedFiles;
    } catch (error) {
      logger.withError(
        `Error in printDownstreamAssets: ${error.message}`,
        integrationName,
        headSHA,
        "printDownstreamAssets"
      );
      throw error;
    }
  }

  async setResourceOnAsset({ octokit, context }) {
    logger.withInfo(
      "Setting resources on assets...",
      integrationName,
      headSHA,
      "setResourceOnAsset"
    );

    try {
      const changedFiles = await this.getChangedFiles({ octokit, context });
      const { pull_request } = context.payload;
      var totalChangedFiles = 0;
      let tableMd = ``;
      let setResourceFailed = false;

      if (changedFiles.length === 0) {
        logger.withInfo(
          "No changed files found. Skipping resource setup.",
          integrationName,
          headSHA,
          "setResourceOnAsset"
        );
        return totalChangedFiles;
      }

      for (const { fileName, filePath } of changedFiles) {
        logger.withInfo(
          `Processing file: ${fileName}`,
          integrationName,
          headSHA,
          "setResourceOnAsset"
        );
        const aliasName = await this.getAssetName({
          octokit,
          context,
          fileName,
          filePath,
        });

        const assetName = IGNORE_MODEL_ALIAS_MATCHING ? fileName : aliasName;

        logger.withInfo(
          `Resolved asset name: ${assetName}`,
          integrationName,
          headSHA,
          "setResourceOnAsset"
        );

        const environments = getEnvironments();
        let environment = null;
        for (const [baseBranchName, environmentName] of environments) {
          if (baseBranchName === context.payload.pull_request.base.ref) {
            environment = environmentName;
            break;
          }
        }

        logger.withInfo(
          `Processing asset: ${assetName} in environment: ${environment}`,
          integrationName,
          headSHA,
          "setResourceOnAsset"
        );

        const asset = await getAsset({
          name: assetName,
          sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
          environment: environment,
          integration: "github",
        });

        if (asset.error) {
          logger.withError(
            `Failed to retrieve asset: ${assetName}, Error: ${asset.error}`,
            integrationName,
            headSHA,
            "setResourceOnAsset"
          );
          continue;
        }

        const materialisedAsset = asset?.attributes?.dbtModelSqlAssets?.[0];
        const timeStart = Date.now();

        const totalModifiedFiles = changedFiles.filter(
          (i) => i.status === "modified"
        ).length;

        const downstreamAssets = await getDownstreamAssets(
          asset,
          materialisedAsset.guid,
          totalModifiedFiles,
          this.sendSegmentEventOfIntegration,
          "github"
        );

        if (downstreamAssets.error) {
          logger.withError(
            `Failed to retrieve downstream assets for: ${assetName}, Error: ${downstreamAssets.error}`,
            integrationName,
            headSHA,
            "setResourceOnAsset"
          );
          continue;
        }

        this.sendSegmentEventOfIntegration({
          action: "dbt_ci_action_downstream_unfurl",
          properties: {
            asset_guid: asset.guid,
            asset_type: asset.typeName,
            downstream_count: downstreamAssets.entities.length,
            total_fetch_time: Date.now() - timeStart,
          },
        });

        const model = asset;
        const materialisedView = asset?.attributes?.dbtModelSqlAssets?.[0];

        let PR_TITLE = pull_request.title;

        if (downstreamAssets.entityCount != 0) {
          if (model) {
            const { guid: modelGuid } = model;
            const resp = await createResource(
              modelGuid,
              PR_TITLE,
              pull_request.html_url,
              this.sendSegmentEventOfIntegration
            );
            const md = getMDCommentForModel(ATLAN_INSTANCE_URL, model);
            tableMd += getTableMD(md, resp);
            if (!resp) {
              setResourceFailed = true;
              logger.withError(
                `Setting resource failed for model: ${modelGuid}`,
                integrationName,
                headSHA,
                "setResourceOnAsset"
              );
            }
          }

          if (materialisedView) {
            const { guid: tableAssetGuid } = materialisedView;
            const resp = await createResource(
              tableAssetGuid,
              PR_TITLE,
              pull_request.html_url,
              this.sendSegmentEventOfIntegration
            );
            const md = getMDCommentForMaterialisedView(
              ATLAN_INSTANCE_URL,
              materialisedView
            );
            tableMd += getTableMD(md, resp);
            if (!resp) {
              setResourceFailed = true;
              logger.withError(
                `Setting resource failed for materialized view: ${tableAssetGuid}`,
                integrationName,
                headSHA,
                "setResourceOnAsset"
              );
            }
          }
        }
        totalChangedFiles++;
      }

      const comment = await this.createIssueComment({
        octokit,
        context,
        content: getSetResourceOnAssetComment(tableMd, setResourceFailed),
        comment_id: null,
        forceNewComment: true,
      });

      logger.withInfo(
        "Successfully set the resource on the asset",
        integrationName,
        headSHA,
        "setResourceOnAsset"
      );

      return totalChangedFiles;
    } catch (error) {
      logger.withError(
        `Error in setResourceOnAsset: ${error}`,
        integrationName,
        headSHA,
        "setResourceOnAsset"
      );
      throw error;
    }
  }

  async authIntegration({ octokit, context }) {
    logger.withInfo(
      "Authenticating with Atlan",
      integrationName,
      headSHA,
      "authIntegration"
    );

    try {
      const response = await auth();

      const existingComment = await this.checkCommentExists({
        octokit,
        context,
      });

      logger.withInfo(
        `Existing Comment: ${existingComment?.id}`,
        integrationName,
        headSHA,
        "authIntegration"
      );

      if (response?.status === 401) {
        logger.withError(
          "Authentication failed: Status 401",
          integrationName,
          headSHA,
          "authIntegration"
        );
        await this.createIssueComment({
          octokit,
          context,
          content: getErrorResponseStatus401(ATLAN_INSTANCE_URL, context),
          comment_id: existingComment?.id,
        });
        return false;
      }

      if (response === undefined) {
        logger.withError(
          "Authentication failed: Undefined response",
          integrationName,
          headSHA,
          "authIntegration"
        );
        await this.createIssueComment({
          octokit,
          context,
          content: getErrorResponseStatusUndefined(ATLAN_INSTANCE_URL, context),
          comment_id: existingComment?.id,
        });
        return false;
      }
      logger.withInfo(
        "Successfully Authenticated with Atlan",
        integrationName,
        headSHA,
        "authIntegration"
      );
      return true;
    } catch (error) {
      logger.withError(
        `Error in authIntegration: ${error.message}`,
        integrationName,
        headSHA,
        "authIntegration"
      );
      throw error;
    }
  }

  async sendSegmentEventOfIntegration({ action, properties }) {
    try {
      const domain = new URL(ATLAN_INSTANCE_URL).hostname;
      const { context } = github; //confirm this
      logger.withInfo(
        `Sending Segment event for action: ${action}`,
        integrationName,
        headSHA,
        "sendSegmentEventOfIntegration"
      );

      const raw = stringify({
        category: "integration",
        object: "github",
        action,
        userId: "atlan-annonymous-github",
        properties: {
          ...properties,
          github_action_id: `https://github.com/${context?.payload?.repository?.full_name}/actions/runs/${context?.runId}`,
          domain,
        },
      });

      return sendSegmentEvent(action, raw);
    } catch (error) {
      logger.withError(
        `Error sending Segment event for action: ${action} - ${error.message}`,
        integrationName,
        headSHA,
        "sendSegmentEventOfIntegration"
      );
      throw error;
    }
  }

  async getChangedFiles({ octokit, context }) {
    try {
      logger.withInfo(
        "Fetching changed files...",
        integrationName,
        headSHA,
        "getChangedFiles"
      );

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
          } catch (e) {
            logger.withError(
              `Error processing file: ${filename} - ${e.message}`,
              integrationName,
              headSHA,
              "getChangedFiles"
            );
          }
        })
        .filter((i) => i !== undefined);

      changedFiles = changedFiles.filter((item, index) => {
        return (
          changedFiles.findIndex((obj) => obj.fileName === item.fileName) ===
          index
        );
      });

      logger.withInfo(
        "Successfully fetched changed files",
        integrationName,
        headSHA,
        "getChangedFiles"
      );

      return changedFiles;
    } catch (error) {
      logger.withError(
        `Error fetching changed files - ${error.message}`,
        integrationName,
        headSHA,
        "getChangedFiles"
      );
      throw error;
    }
  }

  async getAssetName({ octokit, context, fileName, filePath }) {
    try {
      logger.withInfo(
        "Getting asset name...",
        integrationName,
        headSHA,
        "getAssetName"
      );

      var regExp =
        /{{\s*config\s*\(\s*(?:[^,]*,)*\s*alias\s*=\s*['"]([^'"]+)['"](?:\s*,[^,]*)*\s*\)\s*}}/im;
      var fileContents = await this.getFileContents({
        octokit,
        context,
        filePath,
      });

      if (fileContents) {
        var matches = regExp.exec(fileContents);
        if (matches) {
          logger.withInfo(
            `Found a match: ${matches[1].trim()}`,
            integrationName,
            headSHA,
            "getAssetName"
          );
          return matches[1].trim();
        }
      }
      logger.withInfo(
        `Using filename as asset name: ${fileName}`,
        integrationName,
        headSHA,
        "getAssetName"
      );
      return fileName;
    } catch (error) {
      logger.withError(
        `Error getting asset name - ${error.message}`,
        integrationName,
        headSHA,
        "getAssetName"
      );
      throw error;
    }
  }

  async getFileContents({ octokit, context, filePath }) {
    try {
      logger.withInfo(
        "Fetching file contents...",
        integrationName,
        headSHA,
        "getFileContents"
      );

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
          logger.withError(
            `Error fetching file contents: ${e.message}`,
            integrationName,
            headSHA,
            "getFileContents"
          );
          return null;
        });

      if (!res) return null;

      const buff = Buffer.from(res.data.content, "base64");

      logger.withInfo(
        "Successfully fetched file contents",
        integrationName,
        headSHA,
        "getFileContents"
      );

      return buff.toString("utf8");
    } catch (error) {
      logger.withError(
        `Error in getFileContents: ${error.message}`,
        integrationName,
        headSHA,
        "getFileContents"
      );
      throw error;
    }
  }

  async checkCommentExists({ octokit, context }) {
    logger.withInfo(
      "Checking for existing comments...",
      integrationName,
      headSHA,
      "checkCommentExists"
    );

    if (IS_DEV) {
      logger.withInfo(
        "Development mode enabled. Skipping comment check.",
        integrationName,
        headSHA,
        "checkCommentExists"
      );
      return null;
    }

    const { pull_request } = context.payload;

    try {
      const comments = await octokit.rest.issues.listComments({
        ...context.repo,
        issue_number: pull_request.number,
      });

      const existingComment = comments.data.find(
        (comment) =>
          comment.user.login === "github-actions[bot]" &&
          comment.body.includes(
            "<!-- ActionCommentIdentifier: atlan-dbt-action -->"
          )
      );
      if (existingComment) {
        logger.withInfo(
          "Found existing comment: " + existingComment?.id,
          integrationName,
          headSHA,
          "checkCommentExists"
        );
      } else {
        logger.withInfo(
          "No existing comment found",
          integrationName,
          headSHA,
          "checkCommentExists"
        );
      }

      return existingComment;
    } catch (error) {
      logger.withError(
        "Error checking for existing comments: " + error.message,
        integrationName,
        headSHA,
        "checkCommentExists"
      );
      throw error;
    }
  }

  async createIssueComment({
    octokit,
    context,
    content,
    comment_id = null,
    forceNewComment = false,
  }) {
    logger.withInfo(
      "Creating an issue comment...",
      integrationName,
      headSHA,
      "createIssueComment"
    );

    const { pull_request } = context?.payload || {};

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`;

    const commentObj = {
      ...context.repo,
      issue_number: pull_request.number,
      body: content,
    };

    if (IS_DEV) {
      logger.withInfo(
        "Development mode enabled. Skipping comment creation.",
        integrationName,
        headSHA,
        "createIssueComment"
      );
      return content;
    }

    if (comment_id && !forceNewComment)
      return octokit.rest.issues.updateComment({ ...commentObj, comment_id });
    return octokit.rest.issues.createComment(commentObj);
  }

  async deleteComment({ octokit, context, comment_id }) {
    logger.withInfo(
      `Deleted comment with ID ${comment_id}`,
      integrationName,
      headSHA,
      "deleteComment"
    );

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
    logger.withInfo(
      "Rendering Downstream Assets...",
      integrationName,
      headSHA,
      "renderDownstreamAssetsComment"
    );
    try {
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

      const assetInfo = getAssetInfo(
        ATLAN_INSTANCE_URL,
        asset,
        materialisedAsset,
        environmentName,
        projectName
      );

      // Generating the downstream table
      const downstreamTable = getDownstreamTable(
        ATLAN_INSTANCE_URL,
        downstreamAssets,
        rows,
        materialisedAsset
      );

      // Generating the "View asset in Atlan" button
      const viewAssetButton = getViewAssetButton(ATLAN_INSTANCE_URL, asset);

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
    } catch (error) {
      logger.withError(
        `Error rendering Downstream Assets: ${error.message}`,
        integrationName,
        headSHA,
        "renderDownstreamAssetsComment"
      );
      throw error;
    }
  }
}
