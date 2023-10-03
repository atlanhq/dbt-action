import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import stringify from "json-stringify-safe";

dotenv.config();

const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export default async function getAsset({
  //Done
  name,
  sendSegmentEventOfIntegration,
  environment,
  integration,
}) {
  var myHeaders = {
    Authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  var raw = stringify({
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
            ...(environment
              ? [
                  {
                    term: {
                      "assetDbtEnvironmentName.keyword": environment,
                    },
                  },
                ]
              : []),
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
    ],
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };
  console.log("Before SendSegmentEventOfIntegration");
  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/search/indexsearch#findAssetByExactName`,
    requestOptions
  )
    .then((e) => e.json())
    .catch((err) => {
      sendSegmentEventOfIntegration({
        action: "dbt_ci_action_failure",
        properties: {
          reason: "failed_to_get_asset",
          asset_name: name,
          msg: err,
        },
      });
    });

  if (!response?.entities?.length)
    return {
      error: `❌ Model with name **${name}** could not be found or is deleted <br><br>`,
    };

  if (!response?.entities[0]?.attributes?.dbtModelSqlAssets?.length > 0)
    return {
      error: `❌ Model with name [${name}](${ATLAN_INSTANCE_URL}/assets/${response.entities[0].guid}/overview?utm_source=dbt_${integration}_action) does not materialise any asset <br><br>`,
    };

  return response.entities[0];
}
