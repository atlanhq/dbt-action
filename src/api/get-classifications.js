import fetch from "node-fetch";
import { sendSegmentEvent } from "./index.js";
import stringify from "json-stringify-safe";
import { getAPIToken, getInstanceUrl } from "../utils/index.js";

const ATLAN_INSTANCE_URL = getInstanceUrl();
const ATLAN_API_TOKEN = getAPIToken();

export default async function getClassifications({
  sendSegmentEventOfIntegration,
}) {
  var myHeaders = {
    Authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/types/typedefs?type=classification`,
    requestOptions
  )
    .then((e) => e.json())
    .catch((err) => {
      sendSegmentEventOfIntegration("dbt_ci_action_failure", {
        reason: "failed_to_get_classifications",
        msg: err,
      });
    });

  return response?.classificationDefs;
}
