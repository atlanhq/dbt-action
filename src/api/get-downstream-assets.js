import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import {
  getConnectorImage,
  getCertificationImage,
  getImageURL,
} from "../utils/index.js";
import stringify from "json-stringify-safe";

dotenv.config();

const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

const ASSETS_LIMIT = 100;

export default async function getDownstreamAssets( //Done
  asset,
  guid,
  totalModifiedFiles,
  sendSegmentEventOfIntegration,
  integration
) {
  var myHeaders = {
    authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "content-type": "application/json",
  };
  console.log("At line 31 inside getDownstreamAssets function");
  var raw = stringify({
    guid: guid,
    size: Math.max(Math.ceil(ASSETS_LIMIT / totalModifiedFiles), 1),
    from: 0,
    depth: 21,
    direction: "OUTPUT",
    entityFilters: {
      condition: "AND",
      criterion: [
        {
          attributeName: "__typeName",
          operator: "not_contains",
          attributeValue: "Process",
        },
        {
          attributeName: "__state",
          operator: "eq",
          attributeValue: "ACTIVE",
        },
      ],
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
    ],
    excludeMeanings: false,
    excludeClassifications: false,
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  var handleError = (err) => {
    const comment = `### ${getConnectorImage(
      asset.attributes.connectorName
    )} [${asset.displayText}](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }/overview?utm_source=dbt_${integration}_action) ${
      asset.attributes?.certificateStatus
        ? getCertificationImage(asset.attributes.certificateStatus)
        : ""
    }
            
_Failed to fetch impacted assets._
            
${getImageURL(
  "atlan-logo",
  15,
  15
)} [View lineage in Atlan](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }/lineage/overview?utm_source=dbt_${integration}_action)`;

    sendSegmentEventOfIntegration("dbt_ci_action_failure", {
      reason: "failed_to_fetch_lineage",
      asset_guid: asset.guid,
      asset_name: asset.name,
      asset_typeName: asset.typeName,
      msg: err,
    });

    return comment;
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/lineage/list`,
    requestOptions
  )
    .then((e) => {
      if (e.status === 200) {
        return e.json();
      } else {
        throw e;
      }
    })
    .catch((err) => {
      return {
        error: handleError(err),
      };
    });
  console.log("At line 126 inside getDownstreamAssets function", response);
  if (response.error) return response;

  return response;
}
