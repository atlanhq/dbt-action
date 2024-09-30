import * as fs from 'fs';

import {
  ATLAN_CONFIG,
  ATLAN_INSTANCE_URL,
  IS_DEV,
} from "../utils/get-environment-variables.js";
import {
  auth,
  getCertificationImage,
  getConnectorImage,
  truncate,
} from "../utils/index.js";
import {
  getContractAssetInfo,
  getDownstreamTable,
  getErrorResponseStatus401,
  getErrorResponseStatusUndefined,
  getViewAssetButton,
} from "../templates/github-integration.js";

import IntegrationInterface from "./contract/contract.js";
import getAssetClassifications from "../api/get-asset-classifications.js"
import getContractAsset from "../api/get-contract-asset.js"
import { getContractImpactAnalysisBaseComment } from "../templates/atlan.js";
import getDownstreamLineageForAssets from "../api/get-downstream-assets.js"
import github from "@actions/github";
import logger from "../logger/logger.js";
import {
  sendSegmentEvent,
} from "../api/index.js";
import stringify from "json-stringify-safe";
import yaml from 'js-yaml';

var headSHA;
const integrationName = "GITHUB_CONTRACT_IMPACT_ANALYSIS";
const actionName = "contract_ci_action"
const utmSource = "dbt_github_action"

export default class ContractIntegration extends IntegrationInterface {
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
        "GITHUB_CONTRACT_IMPACT_ANALYSIS is running...",
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
      }

      if (total_assets !== 0) {
        await this.sendSegmentEventOfIntegration({
          action: `${actionName}_run`,
          properties: {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
          },
        });
      }

      logger.withInfo(
        "Successfully Completed GITHUB_CONTRACT_IMPACT_ANALYSIS",
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
        let warningComments = ``;
        let totalChangedFiles = 0;

        const atlanConfig = ATLAN_CONFIG;

        // Read atlan config file
        const config = this.readYamlFile(atlanConfig);
        if (config.error) {
          logger.withError(
            `Failed to read atlan config file ${atlanConfig}: ${config.error}`,
            integrationName,
            headSHA,
            "printDownstreamAssets"
          );
          return;
        }

        let datasources = this.parseDatasourceFromConfig(config.contentYaml)

        // If no datasources found, do not proceed
        if (datasources.size <= 0) {
          logger.withError(
            `No datasources found in atlan config ${atlanConfig}`,
            integrationName,
            headSHA,
            "printDownstreamAssets"
          );
          return;
        }

        for (const { fileName, filePath, status } of changedFiles) {
            // Skipping non yaml files
            if (!filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) {
              logger.withInfo(
                `Skipping file: ${filePath}`,
                integrationName,
                headSHA,
                "printDownstreamAssets"
              );
              continue
            }

            logger.withInfo(
              `Processing file: ${filePath}`,
              integrationName,
              headSHA,
              "printDownstreamAssets"
            );

            const contract = this.readYamlFile(filePath);
            if (contract.error) {
              logger.withError(
                `Failed to read yaml file ${filePath}: ${contract.error}`,
                integrationName,
                headSHA,
                "printDownstreamAssets"
              );
              continue
            }
            
            let dataset = contract.contentYaml.dataset
            // Skip non contract yaml file
            if (!dataset) {
              continue
            }

            const assetQualifiedName = this.getQualifiedName(
              datasources, 
              contract.contentYaml
            );

            if (assetQualifiedName === undefined) {
              logger.withError(
                `Failed to construct asset qualified name for contract ${filePath}`,
                integrationName,
                headSHA,
                "printDownstreamAssets"
              );
              continue;
            }

            logger.withInfo(
              `Generated asset qualified name ${assetQualifiedName} for contract ${filePath}`,
              integrationName,
              headSHA,
              "printDownstreamAssets"
            );

            // Fetch asset from Atlan
            const asset = await getContractAsset({
              dataset,
              assetQualifiedName: assetQualifiedName
            });

            if (asset.error) {
              logger.withError(
                `Assets fetch error for ${dataset}: ${asset.error}`,
                integrationName,
                headSHA,
                "printDownstreamAssets"
              );

              this.sendSegmentEventOfIntegration({
                action: `${actionName}_failure`,
                properties: {
                  reason: "failed_to_get_asset",
                  asset_name: dataset,
                  msg: asset.error,
                },
              });

              totalChangedFiles++
              warningComments += asset.comment;
              warningComments += "\n\n---\n\n"
              continue;
            }

            logger.withInfo(
              `Processing asset: ${dataset}`,
              integrationName,
              headSHA,
              "printDownstreamAssets"
            );
            
            const timeStart = Date.now();
            const totalModifiedFiles = changedFiles.filter(
              (i) => i.status === "modified"
            ).length;
            
            // Fetch downstream assets
            const downstreamAssets = await getDownstreamLineageForAssets(
                asset,
                asset.guid,
                totalModifiedFiles,
                utmSource
            );
    
            if (downstreamAssets.error) {
                logger.withError(
                  `Downstream assets error for ${dataset}: ${downstreamAssets.error}`,
                  integrationName,
                  headSHA,
                  "printDownstreamAssets"
                );

                this.sendSegmentEventOfIntegration({
                  action: `${actionName}_failure`,
                  properties: {
                    reason: "failed_to_fetch_lineage",
                    asset_guid: asset.guid,
                    asset_name: asset.name,
                    asset_typeName: asset.typeName,
                    msg: downstreamAssets.error,
                  },
                });

                totalChangedFiles++
                warningComments += downstreamAssets.comment;
                warningComments += "\n\n---\n\n"
                continue;
            }

            // Send segment event for successful downstream asset fetch
            this.sendSegmentEventOfIntegration({
                action: `${actionName}_downstream_unfurl`,
                properties: {
                  asset_guid: asset.guid,
                  asset_type: asset.typeName,
                  downstream_count: downstreamAssets.entities.length,
                  total_fetch_time: Date.now() - timeStart,
                },
            });
    
            // Fetch classification for asset
            const classifications = await getAssetClassifications()

            if (classifications.error) {
              logger.withError(
                `Failed to fetch cllassification for ${assetObj["name"]}: ${classifications.error}`,
                integrationName,
                headSHA,
                "printDownstreamAssets"
              );
              
              this.sendSegmentEventOfIntegration({
                action: `${actionName}_failure`,
                properties: {
                  reason: "failed_to_get_classifications",
                  msg: classifications.error,
                },
              });
            }
    
            // Construct comment for displaying downstream assets
            const comment = await this.renderDownstreamAssetsComment({
                asset,
                downstreamAssets,
                classifications,
            });
            
            comments += comment;

            if (comment.trim() !== "") {
              comments += "\n\n---\n\n";
            }
    
            totalChangedFiles++;
        }
        
        // Add header comment before asset info comments
        comments = getContractImpactAnalysisBaseComment(
          totalChangedFiles, 
          comments, 
          warningComments
        );

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
            const isYamlFile = filename.match(/\.(yaml|yml)$/);

            if (isYamlFile) {
              const contractName = filename.split('/').pop().replace(/\.(yaml|yml)$/, '');
              return {
                fileName: contractName,
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
            "<!-- ActionCommentIdentifier: atlan-contract-action -->"
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

    content = `<!-- ActionCommentIdentifier: atlan-contract-action -->
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
    asset,
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

      const assetInfo = getContractAssetInfo(
        ATLAN_INSTANCE_URL,
        asset
      );

      // Generating the downstream table
      const downstreamTable = getDownstreamTable(
        ATLAN_INSTANCE_URL,
        downstreamAssets,
        rows,
        asset
      );

      // Generating the "View asset in Atlan" button
      const viewAssetButton = getViewAssetButton(ATLAN_INSTANCE_URL, asset);

      // Generating the final comment based on the presence of downstream assets
      if (downstreamAssets.entityCount > 0) {
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

  readYamlFile(filePath) {
    try {
      // Read file content synchronously
      const data = fs.readFileSync(filePath, 'utf8');
      
      // Parse the YAML data
      const parsedData = yaml.load(data);
      
      // Return parsed data
      return {
        contentString: data,
        contentYaml: parsedData
      };
    } catch (err) {
      return {
        error: err
      };
    }
  }

  parseDatasourceFromConfig(configYaml) {
    // Create a Map for keys starting with "data_source "
    const dataSourceMap = new Map();

    // Iterate through the object to find relevant keys
    for (const [key, value] of Object.entries(configYaml)) {
        if (key.startsWith('data_source ')) {
            // Trim the prefix and add to the Map
            const trimmedKey = key.replace('data_source ', '');
            dataSourceMap.set(trimmedKey, value);
        }
    }

    return dataSourceMap;
  }

  getQualifiedName(datasources, contractYaml) {
    if (contractYaml["data_source"] === undefined) {
      return;
    }

    if (!datasources.has(contractYaml.data_source)) {
      return;
    }

    let datasource = datasources.get(contractYaml.data_source)
    const qualifiedName = datasource?.connection?.qualified_name || '';
    const database = datasource?.database || '';
    const schema = datasource?.schema || '';
    // Format the output
    const assetQualifiedName = `${qualifiedName}/${database}/${schema}/${contractYaml.dataset}`;
    return assetQualifiedName;
  }
}
