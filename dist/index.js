/******/ var __webpack_modules__ = ({

/***/ 105:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 82:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 341:
/***/ ((module) => {

module.exports = eval("require")("dotenv");


/***/ }),

/***/ 774:
/***/ ((module) => {

module.exports = eval("require")("json-stringify-safe");


/***/ }),

/***/ 585:
/***/ ((module) => {

module.exports = eval("require")("node-fetch");


/***/ }),

/***/ 151:
/***/ ((module) => {

module.exports = eval("require")("uuid");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

// EXTERNAL MODULE: ../../../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?dotenv
var _notfounddotenv = __nccwpck_require__(341);
// EXTERNAL MODULE: ../../../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/core
var core = __nccwpck_require__(105);
// EXTERNAL MODULE: ../../../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/github
var github = __nccwpck_require__(82);
// EXTERNAL MODULE: ../../../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?node-fetch
var _notfoundnode_fetch = __nccwpck_require__(585);
;// CONCATENATED MODULE: ./src/utils/get-image-url.js


function getImageURL(name, height = 20, width = 20) {
    try {
        return `<img src="${hosted_images[name].url}" alt="${hosted_images[name].alt}" height="${height}" width="${width}"/>`;
    } catch (e) {
        console.log(name);
        return '';
    }
}

function getConnectorImage(connectorName) {
    return getImageURL(`connector-${connectorName.toLowerCase()}`, 15, 15);
}

function getCertificationImage(certificationStatus) {
    return getImageURL(`certification-${certificationStatus.toLowerCase()}`, 15, 15);
}

;// CONCATENATED MODULE: ./src/utils/hosted-images.js
/* harmony default export */ const hosted_images = ({
    "atlan-logo": {
        alt: "Atlan Logo",
        url: "https://assets.atlan.com/assets/atlan-a-logo-blue-background.png",
    },
    "atlan-view-asset-button": {
        alt: "View Asset in Atlan Button",
        url: "https://iili.io/H11nfVe.png",
    },
    "atlan-show-lineage-button": {
        alt: "View Lineage in Atlan Button",
        url: "https://iili.io/H11hy1n.png",
    },
    "certification-deprecated": {
        alt: "Certificate Status Deprecated",
        url: "https://assets.atlan.com/assets/status-deprecated.svg",
    },
    "certification-draft": {
        alt: "Certificate Status Drafted",
        url: "https://assets.atlan.com/assets/status-draft.svg",
    },
    "certification-verified": {
        alt: "Certificate Status Verified",
        url: "https://assets.atlan.com/assets/status-verified.svg",
    },
    "connector-airflow": {
        alt: "Connector Airflow",
        url: "https://assets.atlan.com/assets/airflow.svg",
    },
    "connector-athena": {
        alt: "Connector Athena",
        url: "https://assets.atlan.com/assets/athena.svg",
    },
    "connector-aws-s3": {
        alt: "Connector AWS S3",
        url: "https://assets.atlan.com/assets/s3-logo.svg",
    },
    "connector-azure-datalake": {
        alt: "Connector Azure Datalake",
        url: "https://iili.io/H2iiZy7.png",
    },
    "connector-bigquery": {
        alt: "Connector BigQuery",
        url: "https://assets.atlan.com/assets/bigquery.svg",
    },
    "connector-databricks": {
        alt: "Connector Databricks",
        url: "https://assets.atlan.com/assets/databricks.svg",
    },
    "connector-dbt": {
        alt: "Connector dbt",
        url: "https://assets.atlan.com/assets/dbt-new.svg",
    },
    "connector-gcp": {
        alt: "Connector GCP",
        url: "https://assets.atlan.com/assets/gcp-logo.svg",
    },
    "connector-glue": {
        alt: "Connector Glue",
        url: "https://assets.atlan.com/assets/aws-glue.svg",
    },
    "connector-grafana": {
        alt: "Connector Grafana",
        url: "https://assets.atlan.com/assets/grafana.svg",
    },
    "connector-looker": {
        alt: "Connector Looker",
        url: "https://assets.atlan.com/assets/looker.svg",
    },
    "connector-mocks": {
        alt: "Connector Mocks",
        url: "https://iili.io/H2isqwF.png",
    },
    "connector-mysql": {
        alt: "Connector MySQL",
        url: "https://assets.atlan.com/assets/mysql.svg",
    },
    "connector-oracle": {
        alt: "Connector Oracle",
        url: "https://assets.atlan.com/assets/oracle.svg",
    },
    "connector-postgres": {
        alt: "Connector Postgres",
        url: "https://assets.atlan.com/assets/postgresql.svg",
    },
    "connector-powerbi": {
        alt: "Connector PowerBI",
        url: "https://assets.atlan.com/assets/powerbi.svg",
    },
    "connector-presto": {
        alt: "Connector Presto",
        url: "https://iili.io/H2isIFR.png",
    },
    "connector-python": {
        alt: "Connector Python",
        url: "https://iili.io/H2isTap.png",
    },
    "connector-r": {
        alt: "Connector R",
        url: "https://iili.io/H2isu8N.png",
    },
    "connector-redash": {
        alt: "Connector Redash",
        url: "https://assets.atlan.com/assets/redash-logo.svg",
    },
    "connector-redshift": {
        alt: "Connector Redshift",
        url: "https://assets.atlan.com/assets/redshift.svg",
    },
    "connector-sisense": {
        alt: "Connector Sisense",
        url: "https://assets.atlan.com/assets/sisense-logo.svg",
    },
    "connector-snowflake": {
        alt: "Connector Snowflake",
        url: "https://assets.atlan.com/assets/snowflake.svg",
    },
    "connector-tableau": {
        alt: "Connector Tableau",
        url: "https://assets.atlan.com/assets/tableau.svg",
    },
    "connector-mode": {
        alt: "Connector Mode",
        url: "https://iili.io/HVTAlgs.png"
    },
    "connector-sigma": {
        alt: "Connector Sigma",
        url: "https://iili.io/HVTA1dG.png"
    }
});

;// CONCATENATED MODULE: ./src/utils/get-environment-variables.js



_notfounddotenv.config();

const {IS_DEV, ATLAN_INSTANCE_URL, ATLAN_API_TOKEN, IGNORE_MODEL_ALIAS_MATCHING} = process.env;

const isDev = () => IS_DEV === "true";
const getInstanceUrl = () => {
    if (ATLAN_INSTANCE_URL) return new URL(ATLAN_INSTANCE_URL).origin;
    return new URL(core.getInput("ATLAN_INSTANCE_URL")).origin;
};
const getAPIToken = () => {
    if (ATLAN_API_TOKEN) return ATLAN_API_TOKEN;
    return core.getInput("ATLAN_API_TOKEN");
}
const getEnvironments = () => {
    return core.getInput('DBT_ENVIRONMENT_BRANCH_MAP') ?
        core.getInput('DBT_ENVIRONMENT_BRANCH_MAP').trim()?.split('\n')?.map(i => i.split(':').map(i => i.trim())) : []
}
const isIgnoreModelAliasMatching = () => core.getInput("IGNORE_MODEL_ALIAS_MATCHING") === "true";
;// CONCATENATED MODULE: ./src/utils/create-comment.js



const create_comment_IS_DEV = isDev();
const create_comment_ATLAN_INSTANCE_URL =
    getInstanceUrl();

function truncate(value) {
    if (typeof value === 'string')
        return value.length > 100 ? value.substring(0, 100) + "..." : value;
    if (Array.isArray(value))
        return value.length > 10 ? value.slice(0, 10).join(", ") + "..." : value.join(", ");
    return ""
}

async function renderDownstreamAssetsComment(
    octokit,
    context,
    asset,
    materialisedAsset,
    downstreamAssets,
    classifications
) {
    // Mapping the downstream assets data
    let impactedData = downstreamAssets.entities.map(
        ({
             displayText,
             guid,
             typeName,
             attributes,
             meanings,
             classificationNames
         }) => {
            // Modifying the typeName and getting the readableTypeName
            let readableTypeName = typeName
                .toLowerCase()
                .replace(attributes.connectorName, "")
                .toUpperCase();

            // Filtering classifications based on classificationNames
            let classificationsObj = classifications.filter(({name}) =>
                classificationNames.includes(name)
            );

            // Modifying the readableTypeName
            readableTypeName = readableTypeName.charAt(0).toUpperCase() + readableTypeName.slice(1).toLowerCase();

            return [
                guid,
                truncate(displayText),
                truncate(attributes.connectorName),
                truncate(readableTypeName),
                truncate(attributes?.userDescription || attributes?.description || ""),
                attributes?.certificateStatus || "",
                truncate([...attributes?.ownerUsers, ...attributes?.ownerGroups] || []),
                truncate(meanings.map(({displayText, termGuid}) =>
                    `[${displayText}](${create_comment_ATLAN_INSTANCE_URL}/assets/${termGuid}/overview?utm_source=dbt_github_action)`
                )),
                truncate(classificationsObj?.map(({name, displayName}) =>
                    `\`${displayName}\``
                )),
                attributes?.sourceURL || ""
            ];
        }
    );

    // Sorting the impactedData first by typeName and then by connectorName
    impactedData = impactedData.sort((a, b) => a[3].localeCompare(b[3]));
    impactedData = impactedData.sort((a, b) => a[2].localeCompare(b[2]));

    // Creating rows for the downstream table
    let rows = impactedData.map(
        ([guid, displayText, connectorName, typeName, description, certificateStatus, owners, meanings, classifications, sourceUrl]) => {
            // Getting connector and certification images
            const connectorImage = getConnectorImage(connectorName);
            const certificationImage = certificateStatus ? getCertificationImage(certificateStatus) : "";

            return [
                `${connectorImage} [${displayText}](${create_comment_ATLAN_INSTANCE_URL}/assets/${guid}/overview?utm_source=dbt_github_action) ${certificationImage}`,
                `\`${typeName}\``,
                description,
                owners,
                meanings,
                classifications,
                sourceUrl ? `[Open in ${connectorName}](${sourceUrl})` : " "
            ];
        }
    );

    const environmentName = materialisedAsset?.attributes?.assetDbtEnvironmentName
    const projectName = materialisedAsset?.attributes?.assetDbtProjectName
    // Generating asset information
    const assetInfo = `### ${getConnectorImage(asset.attributes.connectorName)} [${
        asset.displayText
    }](${create_comment_ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action) ${
        asset.attributes?.certificateStatus
            ? getCertificationImage(asset.attributes.certificateStatus)
            : ""
    }
Materialised asset: ${getConnectorImage(materialisedAsset.attributes.connectorName)} [${
        materialisedAsset.attributes.name
    }](${create_comment_ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/overview?utm_source=dbt_github_action) ${
        materialisedAsset.attributes?.certificateStatus
            ? getCertificationImage(materialisedAsset.attributes.certificateStatus)
            : ""
    }${environmentName ? ` | Environment Name: \`${environmentName}\`` : ''}${projectName ? ` | Project Name: \`${projectName}\`` : ''}`;

    // Generating the downstream table
    const downstreamTable = `<details><summary><b>${downstreamAssets.entityCount} downstream assets 👇</b></summary><br/>

Name | Type | Description | Owners | Terms | Classifications | Source URL
--- | --- | --- | --- | --- | --- | ---       
${rows.map((row) => row.map(i => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")).join("\n")}

${downstreamAssets.hasMore ? `[See more downstream assets at Atlan](${create_comment_ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/lineage?utm_source=dbt_github_action)` : ""}

</details>`;

    // Generating the "View asset in Atlan" button
    const viewAssetButton = `${getImageURL("atlan-logo", 15, 15)} [View asset in Atlan](${create_comment_ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action)`;

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


async function checkCommentExists(octokit, context) {
    if (create_comment_IS_DEV) return null;

    const {pull_request} = context.payload;

    const comments = await octokit.rest.issues.listComments({
        ...context.repo,
        issue_number: pull_request.number,
    });

    return comments.data.find(
        (comment) => comment.user.login === "github-actions[bot]" && comment.body.includes("<!-- ActionCommentIdentifier: atlan-dbt-action -->")
    );
}

async function createIssueComment(octokit, context, content, comment_id = null, forceNewComment = false) {
    const {pull_request} = context.payload;

    content = `<!-- ActionCommentIdentifier: atlan-dbt-action -->
${content}`

    const commentObj = {
        ...context.repo,
        issue_number: pull_request.number,
        body: content,
    };

    console.log(content, content.length)

    if (create_comment_IS_DEV) return content;

    if (comment_id && !forceNewComment) return octokit.rest.issues.updateComment({...commentObj, comment_id});
    return octokit.rest.issues.createComment(commentObj);
}

async function deleteComment(octokit, context, comment_id) {
    const {pull_request} = context.payload;

    return octokit.rest.issues.deleteComment({
        ...context.repo,
        issue_number: pull_request.number,
        comment_id,
    });
}

;// CONCATENATED MODULE: ./src/utils/file-system.js
async function getFileContents(octokit, context, filePath) {
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

async function getChangedFiles(octokit, context) {
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

async function getAssetName({octokit, context, fileName, filePath}) {
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

;// CONCATENATED MODULE: ./src/utils/auth.js




const auth_ATLAN_INSTANCE_URL =
    getInstanceUrl()
const auth_ATLAN_API_TOKEN =
    getAPIToken();

async function auth(octokit, context) {
    var myHeaders = {
        authorization: `Bearer ${auth_ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    var requestOptions = {
        method: "GET",
        headers: myHeaders,
    };

    var response = await _notfoundnode_fetch(
        `${auth_ATLAN_INSTANCE_URL}/api/service/whoami`,
        requestOptions
    ).catch((err) => {
    });

    const existingComment = await checkCommentExists(octokit, context);

    console.log("Existing Comment", existingComment)

    if (response?.status === 401) {
        await
            createIssueComment(octokit, context, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's action secret. 

Atlan Instance URL: ${auth_ATLAN_INSTANCE_URL}

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`, existingComment?.id)
        return false
    }

    if (response === undefined) {
        await
            createIssueComment(octokit, context, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's action secret. 

Atlan Instance URL: ${auth_ATLAN_INSTANCE_URL}

Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`, existingComment?.id)
        return false
    }

    return true
}

;// CONCATENATED MODULE: ./src/utils/index.js






// EXTERNAL MODULE: ../../../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?json-stringify-safe
var _notfoundjson_stringify_safe = __nccwpck_require__(774);
;// CONCATENATED MODULE: ./src/api/get-downstream-assets.js





const get_downstream_assets_ATLAN_INSTANCE_URL =
    getInstanceUrl();
const get_downstream_assets_ATLAN_API_TOKEN =
    getAPIToken();
const ASSETS_LIMIT = 100;

async function getDownstreamAssets(asset, guid, totalModifiedFiles) {
    var myHeaders = {
        authorization: `Bearer ${get_downstream_assets_ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    var raw = _notfoundjson_stringify_safe({
        "guid": guid,
        "size": Math.max(Math.ceil(ASSETS_LIMIT / totalModifiedFiles), 1),
        "from": 0,
        "depth": 21,
        "direction": "OUTPUT",
        "entityFilters": {
            "condition": "AND",
            "criterion": [
              {
                "attributeName": "__state",
                "operator": "eq",
                "attributeValue": "ACTIVE"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "DbtProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "DbtColumnProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "DataEntityMappingProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "DataAttributeMappingProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "Process"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "ColumnProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "BIProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "FivetranProcess"
              },
              {
                "attributeName": "__typeName",
                "operator": "neq",
                "attributeValue": "FivetranColumnProcess"
              }
            ]
        },
        "entityTraversalFilters": {
            "condition": "AND",
            "criterion": [
              {
                "attributeName": "__state",
                "operator": "eq",
                "attributeValue": "ACTIVE"
              }
            ]
        },
        "relationshipTraversalFilters": {
            "condition": "AND",
            "criterion": [
              {
                "attributeName": "__state",
                "operator": "eq",
                "attributeValue": "ACTIVE"
              }
            ]
        },
        "attributes": [
            "name",
            "description",
            "userDescription",
            "sourceURL",
            "qualifiedName",
            "connectorName",
            "certificateStatus",
            "certificateUpdatedBy",
            "certificateUpdatedAt",
            "ownerUsers",
            "ownerGroups",
            "classificationNames",
            "meanings"
        ],
        "excludeMeanings": false,
        "excludeClassifications": false
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var handleError = (err) => {
        const comment = `### ${getConnectorImage(asset.attributes.connectorName)} [${
            asset.displayText
        }](${get_downstream_assets_ATLAN_INSTANCE_URL}/assets/${asset.guid}/overview?utm_source=dbt_github_action) ${
            asset.attributes?.certificateStatus
                ? getCertificationImage(asset.attributes.certificateStatus)
                : ""
        }
            
_Failed to fetch impacted assets._
            
${getImageURL("atlan-logo", 15, 15)} [View lineage in Atlan](${get_downstream_assets_ATLAN_INSTANCE_URL}/assets/${asset.guid}/lineage/overview?utm_source=dbt_github_action)`;

        sendSegmentEvent("dbt_ci_action_failure", {
            reason: 'failed_to_fetch_lineage',
            asset_guid: asset.guid,
            asset_name: asset.name,
            asset_typeName: asset.typeName,
            msg: err
        });

        return comment
    }

    var response = await _notfoundnode_fetch(
        `${get_downstream_assets_ATLAN_INSTANCE_URL}/api/meta/lineage/list`,
        requestOptions
    ).then((e) => {
        if (e.status === 200) {
            return e.json();
        } else {
            throw e;
        }
    }).catch((err) => {
        return {
            error: handleError(err)
        }
    });

    if (response.error) return response;

    return response;
}

;// CONCATENATED MODULE: ./src/api/get-asset.js







const get_asset_ATLAN_INSTANCE_URL =
    getInstanceUrl();
const get_asset_ATLAN_API_TOKEN =
    getAPIToken();

async function getAsset({name}) {
    const environments = getEnvironments();

    let environment = null;
    for (const [baseBranchName, environmentName] of environments) {
        if (baseBranchName === github.context.payload.pull_request.base.ref) {
            environment = environmentName
            break;
        }
    }

    var myHeaders = {
        Authorization: `Bearer ${get_asset_ATLAN_API_TOKEN}`,
        "Content-Type": "application/json",
    };

    var raw = _notfoundjson_stringify_safe({
        dsl: {
            from: 0,
            size: 21,
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                __state: "ACTIVE",
                            },
                        },
                        {
                            match: {
                                "__typeName.keyword": "DbtModel",
                            },
                        },
                        {
                            match: {
                                "name.keyword": name,
                            },
                        },
                        ...(environment ? [{
                            term: {
                                "assetDbtEnvironmentName.keyword": environment
                            }
                        }] : []),
                    ],
                },
            },
        },
        attributes: [
            "name",
            "description",
            "userDescription",
            "sourceURL",
            "qualifiedName",
            "connectorName",
            "certificateStatus",
            "certificateUpdatedBy",
            "certificateUpdatedAt",
            "ownerUsers",
            "ownerGroups",
            "classificationNames",
            "meanings",
            "dbtModelSqlAssets",
        ],
        relationAttributes: [
            "name",
            "description",
            "assetDbtProjectName",
            "assetDbtEnvironmentName",
            "connectorName",
            "certificateStatus",
        ]
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var response = await _notfoundnode_fetch(
        `${get_asset_ATLAN_INSTANCE_URL}/api/meta/search/indexsearch#findAssetByExactName`,
        requestOptions
    ).then((e) => e.json()).catch(err => {
        sendSegmentEvent("dbt_ci_action_failure", {
            reason: 'failed_to_get_asset',
            asset_name: name,
            msg: err
        });
    });

    if (!response?.entities?.length)
        return {
            error: `❌ Model with name **${name}** could not be found or is deleted <br><br>`,
        };

    if (!response?.entities[0]?.attributes?.dbtModelSqlAssets?.length > 0)
        return {
            error: `❌ Model with name [${name}](${get_asset_ATLAN_INSTANCE_URL}/assets/${response.entities[0].guid}/overview?utm_source=dbt_github_action) does not materialise any asset <br><br>`,
        }

    return response.entities[0];
}

;// CONCATENATED MODULE: ./src/api/get-classifications.js





const get_classifications_ATLAN_INSTANCE_URL =
    getInstanceUrl();
const get_classifications_ATLAN_API_TOKEN =
    getAPIToken();

async function getClassifications() {
    var myHeaders = {
        Authorization: `Bearer ${get_classifications_ATLAN_API_TOKEN}`,
        "Content-Type": "application/json",
    };

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    var response = await _notfoundnode_fetch(
        `${get_classifications_ATLAN_INSTANCE_URL}/api/meta/types/typedefs?type=classification`,
        requestOptions
    ).then((e) => e.json()).catch(err => {
        sendSegmentEvent("dbt_ci_action_failure", {
            reason: 'failed_to_get_classifications',
            msg: err
        });
    });

    return response?.classificationDefs;
}
// EXTERNAL MODULE: ../../../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?uuid
var _notfounduuid = __nccwpck_require__(151);
;// CONCATENATED MODULE: ./src/api/create-resource.js






const create_resource_ATLAN_INSTANCE_URL =
    getInstanceUrl();
const create_resource_ATLAN_API_TOKEN =
    getAPIToken();

async function createResource(guid, name, link) {
    var myHeaders = {
        Authorization: `Bearer ${create_resource_ATLAN_API_TOKEN}`,
        "Content-Type": "application/json",
    };

    var raw = _notfoundjson_stringify_safe({
        entities: [
            {
                typeName: "Link",
                attributes: {
                    qualifiedName: (0,_notfounduuid.v4)(),
                    name,
                    link,
                    tenantId: "default",
                },
                relationshipAttributes: {
                    asset: {
                        guid,
                    },
                },
            },
        ],
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var response = await _notfoundnode_fetch(
        `${create_resource_ATLAN_INSTANCE_URL}/api/meta/entity/bulk`,
        requestOptions
    ).then((e) => e.json()).catch(err => {
        console.log(err)
        sendSegmentEvent("dbt_ci_action_failure", {
            reason: 'failed_to_create_resource',
            asset_name: name,
            msg: err
        });
    })

    console.log("Created Resource:", response)

    if(response?.errorCode) {
        return null
    }

    return response;
}

;// CONCATENATED MODULE: ./src/api/segment.js





const segment_IS_DEV = isDev();
const segment_ATLAN_INSTANCE_URL =
    getInstanceUrl();
const segment_ATLAN_API_TOKEN =
    getAPIToken();

async function sendSegmentEvent(action, properties) {
    var myHeaders = {
        authorization: `Bearer ${segment_ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    var domain = new URL(segment_ATLAN_INSTANCE_URL).hostname;

    var raw = _notfoundjson_stringify_safe({
        category: "integration",
        object: "github",
        action,
        userId: "atlan-annonymous-github",
        properties: {
            ...properties,
            github_action_id: `https://github.com/${github.context.payload.repository.full_name}/actions/runs/${github.context.runId}`,
            domain,
        },
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var response = null

    if (!segment_IS_DEV) {
        response = await _notfoundnode_fetch(
            `${segment_ATLAN_INSTANCE_URL}/api/service/segment/track`,
            requestOptions
        )
            .then(() => {
                console.log("send segment event", action, raw);
            })
            .catch((err) => {
                console.log("couldn't send segment event", err);
            });
    } else {
        console.log("send segment event", action, raw);
    }

    return response;
}

;// CONCATENATED MODULE: ./src/api/index.js






;// CONCATENATED MODULE: ./src/main/print-downstream-assets.js




async function printDownstreamAssets({ octokit, context }) {
  const changedFiles = await getChangedFiles(octokit, context);
  let comments = ``;
  let totalChangedFiles = 0;

  for (const { fileName, filePath, status } of changedFiles) {
    const aliasName = await getAssetName({
      octokit,
      context,
      fileName,
      filePath,
    });
    const assetName = isIgnoreModelAliasMatching() ? fileName : aliasName;
    const asset = await getAsset({ name: assetName });

    if (totalChangedFiles !== 0) comments += "\n\n---\n\n";

    if (status === "added") {
      comments += `### ${getConnectorImage("dbt")} <b>${fileName}</b> 🆕
Its a new model and not present in Atlan yet, you'll see the downstream impact for it after its present in Atlan.`;
      totalChangedFiles++;
      continue;
    }

    if (asset.error) {
      comments += asset.error;
      totalChangedFiles++;
      continue;
    }

    const materialisedAsset = asset.attributes.dbtModelSqlAssets[0];
    const timeStart = Date.now();
    const totalModifiedFiles = changedFiles.filter(
      (i) => i.status === "modified"
    ).length;
    const downstreamAssets = await getDownstreamAssets(
      asset,
      materialisedAsset.guid,
      totalModifiedFiles
    );

    if (downstreamAssets.error) {
      comments += downstreamAssets.error;
      totalChangedFiles++;
      continue;
    }

    sendSegmentEvent("dbt_ci_action_downstream_unfurl", {
      asset_guid: asset.guid,
      asset_type: asset.typeName,
      downstream_count: downstreamAssets.entities.length,
      total_fetch_time: Date.now() - timeStart,
    });

    const classifications = await getClassifications();

    const comment = await renderDownstreamAssetsComment(
      octokit,
      context,
      asset,
      materialisedAsset,
      downstreamAssets,
      classifications
    );

    comments += comment;

    totalChangedFiles++;
  }

  comments = `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
Here is your downstream impact analysis for **${totalChangedFiles} ${
    totalChangedFiles > 1 ? "models" : "model"
  }** you have edited.    
    
${comments}`;

  const existingComment = await checkCommentExists(octokit, context);

  if (totalChangedFiles > 0)
    await createIssueComment(octokit, context, comments, existingComment?.id);

  if (totalChangedFiles === 0 && existingComment)
    await deleteComment(octokit, context, existingComment.id);

  return totalChangedFiles;
}

;// CONCATENATED MODULE: ./src/main/set-resource-on-asset.js




const set_resource_on_asset_ATLAN_INSTANCE_URL =
  getInstanceUrl();

async function setResourceOnAsset({ octokit, context }) {
  const changedFiles = await getChangedFiles(octokit, context);
  const { pull_request } = context.payload;
  let tableMd = ``;
  let setResourceFailed = false

  if (changedFiles.length === 0) return;

  const totalModifiedFiles = changedFiles.filter(
    (i) => i.status === "modified"
  ).length;

  for (const { fileName, filePath } of changedFiles) {
    const aliasName = await getAssetName({
      octokit,
      context,
      fileName,
      filePath,
    });
    const assetName = isIgnoreModelAliasMatching() ? fileName : aliasName;
    const asset = await getAsset({ name: assetName });

    if (asset.error) continue;

    const model = asset;
    const materialisedView = asset?.attributes?.dbtModelSqlAssets?.[0];

    if(!materialisedView) continue;

    const downstreamAssets = await getDownstreamAssets(
      asset,
      materialisedView.guid,
      totalModifiedFiles
    );

    if(!downstreamAssets?.entities?.length) continue;

    if (model) {
      const { guid: modelGuid } = model
      const resp = await createResource(
        modelGuid,
        pull_request.title,
        pull_request.html_url
      );
      const md = `${getConnectorImage(model.attributes.connectorName)} [${
        model.displayText
      }](${set_resource_on_asset_ATLAN_INSTANCE_URL}/assets/${model.guid}/overview?utm_source=dbt_github_action)`

      tableMd += `${md} | ${resp ? '✅' : '❌'} \n`;

      if(!resp) setResourceFailed = true
    }

    if (materialisedView) {
      const { guid: tableAssetGuid } = materialisedView
      const resp = await createResource(
        tableAssetGuid,
        pull_request.title,
        pull_request.html_url
      );
      const md = `${getConnectorImage(materialisedView.attributes.connectorName)} [${
        materialisedView.attributes.name
      }](${set_resource_on_asset_ATLAN_INSTANCE_URL}/assets/${materialisedView.guid}/overview?utm_source=dbt_github_action)`

      tableMd += `${md} | ${resp ? '✅' : '❌'}\n`;

      if(!resp) setResourceFailed = true
    }
  }

  if(!tableMd) {
    console.log("No assets have downstream assets.")
    return totalModifiedFiles;
  }

  const comment = await createIssueComment(
    octokit,
    context,
    `## 🎊 Congrats on the merge!
  
This pull request has been added as a resource to the following assets:

${setResourceFailed ? '> ⚠️  Seems like we were unable to set the resources for some of the assets due to insufficient permissions. To ensure that the pull request is linked as a resource, you will need to assign the right persona with requisite permissions to the API token.' : ''}

Name | Resource set successfully
--- | ---
${tableMd}
`,
    null,
    true
  );

  return totalModifiedFiles;
}

;// CONCATENATED MODULE: ./src/main/index.js



;// CONCATENATED MODULE: ./src/index.js








_notfounddotenv.config();

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;

async function run() {
    const timeStart = Date.now();
    const {context} = github;
    const octokit = github.getOctokit(GITHUB_TOKEN);
    const {pull_request} = context.payload;
    const {state, merged} = pull_request;
    console.log("New code");
    if (!await auth(octokit, context)) throw {message: 'Wrong API Token'}

    let total_assets = 0;

    if (state === "open") {
        total_assets = await printDownstreamAssets({octokit, context});
    } else if (state === "closed") {
        if (merged) total_assets = await setResourceOnAsset({octokit, context});
    }

    if (total_assets !== 0)
        sendSegmentEvent("dbt_ci_action_run", {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
        });
}

run().catch((err) => {
    sendSegmentEvent("dbt_ci_action_failure", {
        reason: 'failed_to_run_action',
        msg: err
    });

    core.setFailed(err.message);
});

})();

