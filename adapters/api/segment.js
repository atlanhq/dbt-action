import fetch from "node-fetch";
import {
  IS_DEV,
  ATLAN_INSTANCE_URL,
  ATLAN_API_TOKEN,
} from "../utils/get-environment-variables.js";

export async function sendSegmentEvent(action, body) {
  const myHeaders = {
    authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "content-type": "application/json",
  };

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: body,
  };

  var response = null;
  console.log("IS_DEV", IS_DEV);
  if (!IS_DEV) {
    response = await fetch(
      `${ATLAN_INSTANCE_URL}/api/service/segment/track`,
      requestOptions
    )
      .then(() => {
        console.log("inside ", response);
        console.log("send segment event", action, body);
      })
      .catch((err) => {
        console.log("OHHH NO", response);
        console.log("couldn't send segment event", err);
      });
  } else {
    console.log("Wuttt");
    console.log("send segment event", action, body);
  }

  return response;
}
