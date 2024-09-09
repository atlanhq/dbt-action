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
  name,
  atlanConfig,
  contractSpec,
}) {
  var myHeaders = {
    Authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  var raw = stringify(
    {
       "atlanConfig": atlanConfig,
       "contractSpec": contractSpec
    }
  );

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/service/contracts/asset`,
    requestOptions
  )
    .then((e) => e.json())
    .catch((err) => {
      return {
        error: err,
        comment: getErrorAssetNotFound(name)
      }
    });

  if (!response?.entities?.length) {
    return {
      error: "asset not found",
      comment: getErrorAssetNotFound(name),
    };
  }
  
  return response.entities[0];
}
