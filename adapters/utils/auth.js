import fetch from "node-fetch";
import {
  ATLAN_INSTANCE_URL,
  ATLAN_API_TOKEN,
} from "./get-environment-variables.js";

export async function auth() {
  var myHeaders = {
    authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "content-type": "application/json",
  };

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta`,
    requestOptions
  ).catch((err) => {});

  return response;
}
