import fetch from "node-fetch";
import stringify from "json-stringify-safe";
import {
  getErrorModelNotFound,
  getErrorDoesNotMaterialize,
} from "../templates/atlan.js";
import {
  ATLAN_INSTANCE_URL,
  ATLAN_API_TOKEN,
} from "../utils/get-environment-variables.js";

export default async function getAsset({
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

  if (!response?.entities?.length) {
    return {
      error: getErrorModelNotFound(name),
    };
  }

  if (Array.isArray(response.entities)) {
    response.entities.sort((entityA, entityB) => {
      const hasDbtModelSqlAssetsA =
        entityA.attributes.dbtModelSqlAssets &&
        entityA.attributes.dbtModelSqlAssets.length > 0;
      const hasDbtModelSqlAssetsB =
        entityB.attributes.dbtModelSqlAssets &&
        entityB.attributes.dbtModelSqlAssets.length > 0;

      if (hasDbtModelSqlAssetsA && !hasDbtModelSqlAssetsB) {
        return -1; // entityA comes before entityB
      } else if (!hasDbtModelSqlAssetsA && hasDbtModelSqlAssetsB) {
        return 1; // entityB comes before entityA
      }

      // Primary sorting criterion: Latest createTime comes first
      if (entityA.createTime > entityB.createTime) {
        return -1;
      } else if (entityA.createTime < entityB.createTime) {
        return 1;
      }

      return 0; // No difference in sorting for these two entities
    });
  }

  if (!response?.entities[0]?.attributes?.dbtModelSqlAssets?.length > 0)
    return {
      error: getErrorDoesNotMaterialize(
        name,
        ATLAN_INSTANCE_URL,
        response,
        integration
      ),
    };

  return response.entities[0];
}
