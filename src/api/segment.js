import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";

dotenv.config();

const { IS_DEV } = process.env;
const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export async function sendSegmentEvent(action, body) {
  const myHeaders = {
    authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "content-type": "application/json",
  };
  console.log("At line 18 inide sendSegmentEvent");
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: body,
  };

  var response = null;
  if (!IS_DEV) {
    response = await fetch(
      `${ATLAN_INSTANCE_URL}/api/service/segment/track`,
      requestOptions
    )
      .then(() => {
        console.log("send segment event", action, body);
      })
      .catch((err) => {
        console.log("couldn't send segment event", err);
      });
  } else {
    console.log("send segment event", action, body);
  }
  console.log("At line 40 inside sendSegmentEvent");
  return response;
}
