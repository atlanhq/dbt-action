import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import stringify from "json-stringify-safe";
import { getAPIToken, getInstanceUrl } from "../utils/index.js";

const ATLAN_INSTANCE_URL = getInstanceUrl();
const ATLAN_API_TOKEN = getAPIToken();

export default async function createResource( //Done
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
      sendSegmentEventOfIntegration("dbt_ci_action_failure", {
        reason: "failed_to_create_resource",
        asset_name: name,
        msg: err,
      });
    });

  console.log("Created Resource:", response);

  return response;
}
