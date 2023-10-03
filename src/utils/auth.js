import fetch from "node-fetch";
import dotenv from "dotenv";
import core from "@actions/core";

dotenv.config();

const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export async function auth() {
  //Done
  console.log("Inside auth in utils.js");
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
  console.log("Completed auth in utils.js");
  return response;
}
