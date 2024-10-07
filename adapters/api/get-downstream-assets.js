import fetch from "node-fetch";
import {
  getConnectorImage,
  getCertificationImage,
  getImageURL,
} from "../utils/index.js";
import stringify from "json-stringify-safe";
import {
  ATLAN_INSTANCE_URL,
  ATLAN_API_TOKEN,
} from "../utils/get-environment-variables.js";

const ASSETS_LIMIT = 100;

export default async function getDownstreamAssets(
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

    sendSegmentEventOfIntegration({
      action: "dbt_ci_action_failure",
      properties: {
        reason: "failed_to_fetch_lineage",
        asset_guid: asset.guid,
        asset_name: asset.name,
        asset_typeName: asset.typeName,
        msg: err,
      },
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
  if (response.error) return response;

  return response;
}
