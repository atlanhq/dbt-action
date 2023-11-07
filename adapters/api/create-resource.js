import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import stringify from "json-stringify-safe";
import {
  ATLAN_INSTANCE_URL,
  ATLAN_API_TOKEN,
} from "../utils/get-environment-variables.js";

export default async function createResource(
  guid,
  name,
  link,
  sendSegmentEventOfIntegration
) {
  var myHeaders = {
    Authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  var raw = stringify({
    entities: [
      {
        typeName: "Link",
        attributes: {
          qualifiedName: uuidv4(),
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

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/entity/bulk`,
    requestOptions
  )
    .then((e) => e.json())
    .catch((err) => {
      console.log(err);
      sendSegmentEventOfIntegration({
        action: "dbt_ci_action_failure",
        properties: {
          reason: "failed_to_create_resource",
          asset_name: name, // This should change
          msg: err,
        },
      });
    });

  return response;
}
