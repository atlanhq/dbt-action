import {
  ATLAN_API_TOKEN,
  ATLAN_INSTANCE_URL,
} from "../utils/get-environment-variables.js";

import fetch from "node-fetch";
import {
  getErrorAssetNotFound,
} from "../templates/atlan.js";
import stringify from "json-stringify-safe";

export default async function getContractAsset({
  assetQualifiedName,
}) {
  var myHeaders = {
    Authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  var raw = stringify(
    {
      dsl: {
          from: 0,
          size: 1,
          query: {
              bool: {
                  must: [
                      {
                          match: {
                              __state: "ACTIVE"
                          }
                      },
                      {
                          term: {
                              qualifiedName: assetQualifiedName
                          }
                      }
                  ]
              }
          }
      },
      attributes: [
          "guid",
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
      suppressLogs: true,
      showSearchScore: false,
      excludeClassifications: true,
      includeClassificationNames: true,
      excludeMeanings: false
    }
  );

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/search/indexsearch`,
    requestOptions
  )
    .then((e) => e.json())
    .catch((err) => {
      return {
        error: err,
        comment: getErrorAssetNotFound(assetQualifiedName)
      }
    });

  if (!response?.entities?.length) {
    return {
      error: "asset not found",
      comment: getErrorAssetNotFound(assetQualifiedName),
    };
  }
  
  return response.entities[0];
}
