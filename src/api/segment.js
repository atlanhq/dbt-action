import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import { context } from "@actions/github";

dotenv.config();

const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export default async function sendSegmentEvent(action, properties) {
  var myHeaders = {
    authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "content-type": "application/json",
  };

  var raw = JSON.stringify({
    category: "integrations",
    object: "github",
    action,
    properties: {
      ...properties,
      github_action_id: `https://github.com/${context.payload.repository.full_name}/actions/runs/${context.runId}`,
    },
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  console.log("send segment event", action, properties);

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/service/segment/track`,
    requestOptions
  );

  return response;
}
