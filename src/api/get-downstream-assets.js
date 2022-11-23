import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";

dotenv.config();

const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export default async function getDownstreamAssets(guid) {
  var myHeaders = {
    authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "content-type": "application/json",
  };

  var raw = JSON.stringify({
    depth: 21,
    guid: guid,
    hideProcess: true,
    allowDeletedProcess: false,
    entityFilters: {
      attributeName: "__state",
      operator: "eq",
      attributeValue: "ACTIVE",
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
    direction: "OUTPUT",
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/lineage/getlineage`,
    requestOptions
  ).then((e) => e.json());

  const relations = response.relations;

  return relations.map(({ toEntityId }) => response.guidEntityMap[toEntityId]);
}
