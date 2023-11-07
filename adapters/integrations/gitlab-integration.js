// gitlabIntegration.js
import IntegrationInterface from "./contract/contract.js";
import { Gitlab } from "@gitbeaker/rest";
import {
  createResource,
  getAsset,
  getDownstreamAssets,
  sendSegmentEvent,
  getClassifications,
} from "../api/index.js";
import {
  auth,
  getConnectorImage,
  getCertificationImage,
  getGitLabEnvironments,
  truncate,
} from "../utils/index.js";
import stringify from "json-stringify-safe";
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
} from "../templates/gitlab-integration.js";
import { getNewModelAddedComment, getBaseComment } from "../templates/atlan.js";
import {
  IS_DEV,
  ATLAN_INSTANCE_URL,
  CI_PROJECT_PATH,
  CI_PROJECT_ID,
  CI_JOB_URL,
  IGNORE_MODEL_ALIAS_MATCHING,
  CI_COMMIT_MESSAGE,
  CI_PROJECT_NAME,
  CI_COMMIT_SHA,
  getCIMergeRequestIID,
  CI_PROJECT_NAMESPACE,
} from "../utils/get-environment-variables.js";
import logger from "../logger/logger.js";
const integrationName = "gitlab";
var CI_MERGE_REQUEST_IID;

export default class GitLabIntegration extends IntegrationInterface {
  constructor(token) {
    super(token);
  }

  async run() {
    try {
      const timeStart = Date.now();
      const gitlab = new Gitlab({
        host: "https://gitlab.com",
        token: this.token,
      });

      CI_MERGE_REQUEST_IID = await getCIMergeRequestIID(
        gitlab,
        CI_PROJECT_ID,
        CI_COMMIT_SHA
      );

      var mergeRequestCommit = await gitlab.Commits.allMergeRequests(
        CI_PROJECT_ID,
        CI_COMMIT_SHA
      );

      logger.withInfo(
        "GitLab Integration is running...",
        integrationName,
        CI_COMMIT_SHA,
        "run"
      );

      if (!(await this.authIntegration({ gitlab }))) {
        logger.withError(
          "Authentication failed. Wrong API Token.",
          integrationName,
          CI_COMMIT_SHA,
          "run"
        );
        throw { message: "Wrong API Token" };
      }

      let total_assets = 0;

      if (
        mergeRequestCommit.length &&
        mergeRequestCommit[0]?.state == "merged"
      ) {
        const { web_url, target_branch, diff_refs } =
          await gitlab.MergeRequests.show(
            CI_PROJECT_PATH,
            mergeRequestCommit[0]?.iid
          );
        total_assets = await this.setResourceOnAsset({
          gitlab,
          web_url,
          target_branch,
          diff_refs,
        });
      } else {
        const { target_branch, diff_refs } = await gitlab.MergeRequests.show(
          CI_PROJECT_PATH,
          CI_MERGE_REQUEST_IID
        );

        total_assets = await this.printDownstreamAssets({
          gitlab,
          target_branch,
          diff_refs,
        });
      }

      if (total_assets !== 0)
        this.sendSegmentEventOfIntegration({
          action: "dbt_ci_action_run",
          properties: {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
          },
        });

      logger.withInfo(
        "Successfully Completed DBT_CI_PIPELINE",
        integrationName,
        CI_COMMIT_SHA,
        "run"
      );
    } catch (error) {
      logger.withError(
        `Error in run(): ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "run"
      );
      throw error;
    }
  }

  async printDownstreamAssets({ gitlab, target_branch, diff_refs }) {
    logger.withInfo(
      "Printing downstream assets...",
      integrationName,
      CI_COMMIT_SHA,
      "printDownstreamAssets"
    );

    try {
      const changedFiles = await this.getChangedFiles({ gitlab, diff_refs });

      let comments = ``;
      let totalChangedFiles = 0;

      for (const { fileName, filePath, headSHA, status } of changedFiles) {
        logger.withInfo(
          `Processing file: ${fileName}`,
          integrationName,
          CI_COMMIT_SHA,
          "printDownstreamAssets"
        );
        const aliasName = await this.getAssetName({
          gitlab,
          fileName,
          filePath,
          headSHA,
        });
        const assetName = IGNORE_MODEL_ALIAS_MATCHING ? fileName : aliasName;

        const environments = getGitLabEnvironments();
        let environment = null;
        for (const baseBranchName of Object.keys(environments)) {
          const environmentName = environments[baseBranchName];
          if (baseBranchName === target_branch) {
            environment = environmentName;
            break;
          }
        }

        logger.withInfo(
          `Processing asset: ${assetName} in environment: ${environment}`,
          integrationName,
          CI_COMMIT_SHA,
          "printDownstreamAssets"
        );

        const asset = await getAsset({
          name: assetName,
          sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
          environment: environment,
          integration: "gitlab",
        });

        if (totalChangedFiles !== 0) comments += "\n\n---\n\n";

        if (status === "added") {
          logger.withInfo(
            `New model added: ${fileName}`,
            integrationName,
            CI_COMMIT_SHA,
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
            CI_COMMIT_SHA,
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

        const { guid } = asset;

        const downstreamAssets = await getDownstreamAssets(
          asset,
          materialisedAsset.guid,
          totalModifiedFiles,
          this.sendSegmentEventOfIntegration,
          "gitlab"
        );

        if (downstreamAssets.error) {
          logger.withError(
            `Downstream assets error for ${assetName}: ${downstreamAssets.error}`,
            integrationName,
            CI_COMMIT_SHA,
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
          asset,
          downstreamAssets,
          classifications,
          materialisedAsset,
        });

        comments += comment;

        totalChangedFiles++;
      }

      comments = getBaseComment(totalChangedFiles, comments);

      const existingComment = await this.checkCommentExists({ gitlab });

      logger.withInfo(
        `Existing Comment: ${existingComment?.id}`,
        integrationName,
        CI_COMMIT_SHA,
        "printDownstreamAssets"
      );

      if (totalChangedFiles > 0)
        await this.createIssueComment({
          gitlab,
          content: comments,
          comment_id: existingComment?.id,
        });

      if (totalChangedFiles === 0 && existingComment)
        await this.deleteComment({ gitlab, comment_id: existingComment?.id });

      logger.withInfo(
        "Successfully printed Downstream Assets",
        integrationName,
        CI_COMMIT_SHA,
        "printDownstreamAssets"
      );

      return totalChangedFiles;
    } catch (error) {
      logger.withError(
        `Error in printDownstreamAssets: ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "printDownstreamAssets"
      );
      throw error;
    }
  }

  async setResourceOnAsset({ gitlab, web_url, target_branch, diff_refs }) {
    logger.withInfo(
      "Setting resources on assets...",
      integrationName,
      CI_COMMIT_SHA,
      "setResourceOnAsset"
    );

    try {
      const changedFiles = await this.getChangedFiles({ gitlab, diff_refs });

      var totalChangedFiles = 0;
      let tableMd = ``;
      let setResourceFailed = false;
      if (changedFiles.length === 0) {
        logger.withInfo(
          "No changed files found. Skipping resource setup.",
          integrationName,
          CI_COMMIT_SHA,
          "setResourceOnAsset"
        );
        return totalChangedFiles;
      }

      for (const { fileName, filePath, headSHA } of changedFiles) {
        const aliasName = await this.getAssetName({
          gitlab,
          fileName,
          filePath,
          headSHA,
        });

        const assetName = IGNORE_MODEL_ALIAS_MATCHING ? fileName : aliasName;

        logger.withInfo(
          `Resolved asset name: ${assetName}`,
          integrationName,
          CI_COMMIT_SHA,
          "setResourceOnAsset"
        );

        const environments = getGitLabEnvironments();
        let environment = null;
        for (const baseBranchName of Object.keys(environments)) {
          const environmentName = environments[baseBranchName];
          if (baseBranchName === target_branch) {
            environment = environmentName;
            break;
          }
        }

        logger.withInfo(
          `Processing asset: ${assetName} in environment: ${environment}`,
          integrationName,
          CI_COMMIT_SHA,
          "setResourceOnAsset"
        );

        const asset = await getAsset({
          name: assetName,
          sendSegmentEventOfIntegration: this.sendSegmentEventOfIntegration,
          environment: environment,
          integration: "gitlab",
        });

        if (asset.error) {
          logger.withError(
            `Failed to retrieve asset: ${assetName}, Error: ${asset.error}`,
            integrationName,
            CI_COMMIT_SHA,
            "setResourceOnAsset"
          );
          continue;
        }

        const materialisedAsset = asset?.attributes?.dbtModelSqlAssets?.[0];
        const timeStart = Date.now();

        const totalModifiedFiles = changedFiles.filter(
          (i) => i.status === "modified"
        ).length;

        const { guid } = asset;

        const downstreamAssets = await getDownstreamAssets(
          asset,
          materialisedAsset.guid,
          totalModifiedFiles,
          this.sendSegmentEventOfIntegration,
          "gitlab"
        );

        if (downstreamAssets.error) {
          logger.withError(
            `Failed to retrieve downstream assets for: ${assetName}, Error: ${downstreamAssets.error}`,
            integrationName,
            CI_COMMIT_SHA,
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

        var lines = CI_COMMIT_MESSAGE.split("\n");
        var CI_MERGE_REQUEST_TITLE = lines[2];

        if (downstreamAssets.entityCount != 0) {
          if (model) {
            const { guid: modelGuid } = model;
            const resp = await createResource(
              modelGuid,
              CI_MERGE_REQUEST_TITLE,
              web_url,
              this.sendSegmentEventOfIntegration
            );
            const md = getMDCommentForModel(ATLAN_INSTANCE_URL, model);
            tableMd += getTableMD(md, resp);
            if (!resp) {
              setResourceFailed = true;
              logger.withError(
                `Setting resource failed for model: ${modelGuid}`,
                integrationName,
                CI_COMMIT_SHA,
                "setResourceOnAsset"
              );
            }
          }

          if (materialisedView) {
            const { guid: tableAssetGuid } = materialisedView;
            const resp = await createResource(
              tableAssetGuid,
              CI_MERGE_REQUEST_TITLE,
              web_url,
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
                CI_COMMIT_SHA,
                "setResourceOnAsset"
              );
            }
          }
        }

        totalChangedFiles++;
      }

      const comment = await this.createIssueComment({
        gitlab,
        content: getSetResourceOnAssetComment(tableMd, setResourceFailed),
        comment_id: null,
        forceNewComment: true,
      });

      logger.withInfo(
        "Successfully set the resource on the asset",
        integrationName,
        CI_COMMIT_SHA,
        "setResourceOnAsset"
      );

      return totalChangedFiles;
    } catch (error) {
      logger.withError(
        `Error in setResourceOnAsset: ${error}`,
        integrationName,
        CI_COMMIT_SHA,
        "setResourceOnAsset"
      );
      throw error;
    }
  }

  async authIntegration({ gitlab }) {
    logger.withInfo(
      "Authenticating with Atlan",
      integrationName,
      CI_COMMIT_SHA,
      "authIntegration"
    );

    try {
      const response = await auth();

      const existingComment = await this.checkCommentExists({ gitlab });

      logger.withInfo(
        `Existing Comment: ${existingComment?.id}`,
        integrationName,
        CI_COMMIT_SHA,
        "authIntegration"
      );

      if (response?.status === 401) {
        logger.withError(
          "Authentication failed: Status 401",
          integrationName,
          CI_COMMIT_SHA,
          "authIntegration"
        );
        await this.createIssueComment({
          gitlab,
          content: getErrorResponseStatus401(
            ATLAN_INSTANCE_URL,
            CI_PROJECT_NAME,
            CI_PROJECT_NAMESPACE
          ),
          comment_id: existingComment?.id,
        });
        return false;
      }

      if (response === undefined) {
        logger.withError(
          "Authentication failed: Undefined response",
          integrationName,
          CI_COMMIT_SHA,
          "authIntegration"
        );
        await this.createIssueComment({
          gitlab,
          content: getErrorResponseStatusUndefined(
            ATLAN_INSTANCE_URL,
            CI_PROJECT_NAME,
            CI_PROJECT_NAMESPACE
          ),
          comment_id: existingComment?.id,
        });
        return false;
      }
      logger.withInfo(
        "Successfully Authenticated with Atlan",
        integrationName,
        CI_COMMIT_SHA,
        "authIntegration"
      );
      return true;
    } catch (error) {
      logger.withError(
        `Error in authIntegration: ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "authIntegration"
      );
      throw error;
    }
  }

  async createIssueComment({
    gitlab,
    content,
    comment_id = null,
    forceNewComment = false,
  }) {
    logger.withInfo(
      "Creating an issue comment...",
      integrationName,
      CI_COMMIT_SHA,
      "createIssueComment"
    );

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`;

    if (IS_DEV) {
      logger.withInfo(
        "Development mode enabled. Skipping comment creation.",
        integrationName,
        CI_COMMIT_SHA,
        "createIssueComment"
      );
      return content;
    }

    if (comment_id && !forceNewComment) {
      return await gitlab.MergeRequestNotes.edit(
        CI_PROJECT_ID,
        CI_MERGE_REQUEST_IID,
        comment_id,
        {
          body: content,
        }
      );
    }
    return await gitlab.MergeRequestNotes.create(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID,
      content
    );
  }

  async sendSegmentEventOfIntegration({ action, properties }) {
    try {
      const domain = new URL(ATLAN_INSTANCE_URL).hostname;
      logger.withInfo(
        `Sending Segment event for action: ${action}`,
        integrationName,
        CI_COMMIT_SHA,
        "sendSegmentEventOfIntegration"
      );

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

      return sendSegmentEvent(action, raw);
    } catch (error) {
      logger.withError(
        `Error sending Segment event for action: ${action} - ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "sendSegmentEventOfIntegration"
      );
      throw error;
    }
  }

  async getChangedFiles({ gitlab, diff_refs }) {
    try {
      logger.withInfo(
        "Fetching changed files...",
        integrationName,
        CI_COMMIT_SHA,
        "getChangedFiles"
      );

      var changes = await gitlab.MergeRequests.allDiffs(
        CI_PROJECT_PATH,
        CI_MERGE_REQUEST_IID
      );

      var changedFiles = changes
        .map(({ new_path, old_path, new_file }) => {
          try {
            const [modelName] = new_path
              .match(/.*models\/(.*)\.sql/)[1]
              .split("/")
              .reverse()[0]
              .split(".");

            if (modelName) {
              if (new_file) {
                return {
                  fileName: modelName,
                  filePath: new_path,
                  headSHA: diff_refs.head_sha,
                  status: "added",
                };
              } else if (new_path !== old_path) {
                // File is renamed or moved
                return {
                  fileName: modelName,
                  filePath: new_path,
                  headSHA: diff_refs.head_sha,
                  status: "renamed_or_moved",
                };
              } else {
                // File is modified
                return {
                  fileName: modelName,
                  filePath: new_path,
                  headSHA: diff_refs.head_sha,
                  status: "modified",
                };
              }
            }
          } catch (e) {
            logger.withError(
              `Error processing file`,
              integrationName,
              CI_COMMIT_SHA,
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
        CI_COMMIT_SHA,
        "getChangedFiles"
      );

      return changedFiles;
    } catch (error) {
      logger.withError(
        `Error fetching changed files - ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "getChangedFiles"
      );
      throw error;
    }
  }

  async getAssetName({ gitlab, fileName, filePath, headSHA }) {
    try {
      logger.withInfo(
        "Getting asset name...",
        integrationName,
        CI_COMMIT_SHA,
        "getAssetName"
      );

      var regExp =
        /{{\s*config\s*\(\s*(?:[^,]*,)*\s*alias\s*=\s*['"]([^'"]+)['"](?:\s*,[^,]*)*\s*\)\s*}}/im;
      var fileContents = await this.getFileContents({
        gitlab,
        filePath,
        headSHA,
      });

      if (fileContents) {
        var matches = regExp.exec(fileContents);
        if (matches) {
          logger.withInfo(
            `Found a match: ${matches[1].trim()}`,
            integrationName,
            CI_COMMIT_SHA,
            "getAssetName"
          );
          return matches[1].trim();
        }
      }

      logger.withInfo(
        `Using filename as asset name: ${fileName}`,
        integrationName,
        CI_COMMIT_SHA,
        "getAssetName"
      );

      return fileName;
    } catch (error) {
      logger.withError(
        `Error getting asset name - ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "getAssetName"
      );
      throw error;
    }
  }

  async getFileContents({ gitlab, filePath, headSHA }) {
    try {
      logger.withInfo(
        "Fetching file contents...",
        integrationName,
        CI_COMMIT_SHA,
        "getFileContents"
      );

      const { content } = await gitlab.RepositoryFiles.show(
        CI_PROJECT_PATH,
        filePath,
        headSHA
      );
      const buff = Buffer.from(content, "base64");

      logger.withInfo(
        "Successfully fetched file contents",
        integrationName,
        CI_COMMIT_SHA,
        "getFileContents"
      );

      return buff.toString("utf8");
    } catch (error) {
      logger.withError(
        `Error in getFileContents: ${error.message}`,
        integrationName,
        CI_COMMIT_SHA,
        "getFileContents"
      );
      throw error;
    }
  }

  async checkCommentExists({ gitlab }) {
    logger.withInfo(
      "Checking for existing comments...",
      integrationName,
      CI_COMMIT_SHA,
      "checkCommentExists"
    );

    if (IS_DEV) {
      logger.withInfo(
        "Development mode enabled. Skipping comment check.",
        integrationName,
        CI_COMMIT_SHA,
        "checkCommentExists"
      );
      return null;
    }

    try {
      const comments = await gitlab.MergeRequestNotes.all(
        CI_PROJECT_PATH,
        CI_MERGE_REQUEST_IID
      );

      const identifier = `project_${CI_PROJECT_ID}_bot_`;

      const existingComment = comments.find(
        (comment) =>
          comment.author.username.includes(identifier) &&
          comment.body.includes(
            "<!-- ActionCommentIdentifier: atlan-dbt-action -->"
          )
      );
      if (existingComment) {
        logger.withInfo(
          "Found existing comment: " + existingComment?.id,
          integrationName,
          CI_COMMIT_SHA,
          "checkCommentExists"
        );
      } else {
        logger.withInfo(
          "No existing comment found",
          integrationName,
          CI_COMMIT_SHA,
          "checkCommentExists"
        );
      }

      return existingComment;
    } catch (error) {
      logger.withError(
        "Error checking for existing comments: " + error.message,
        integrationName,
        CI_COMMIT_SHA,
        "checkCommentExists"
      );
      throw error;
    }
  }

  async deleteComment({ gitlab, comment_id }) {
    logger.withInfo(
      `Deleted comment with ID ${comment_id}`,
      integrationName,
      CI_COMMIT_SHA,
      "deleteComment"
    );

    return await gitlab.MergeRequestNotes.remove(
      CI_PROJECT_PATH,
      CI_MERGE_REQUEST_IID,
      comment_id
    );
  }

  async renderDownstreamAssetsComment({
    asset,
    downstreamAssets,
    classifications,
    materialisedAsset,
  }) {
    logger.withInfo(
      "Rendering Downstream Assets...",
      integrationName,
      CI_COMMIT_SHA,
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
                  `[${displayText}](${ATLAN_INSTANCE_URL}/assets/${termGuid}/overview?utm_source=dbt_gitlab_action)`
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
            `${connectorImage} [${displayText}](${ATLAN_INSTANCE_URL}/assets/${guid}/overview?utm_source=dbt_gitlab_action) ${certificationImage}`,
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
        CI_COMMIT_SHA,
        "renderDownstreamAssetsComment"
      );
      throw error;
    }
  }
}
