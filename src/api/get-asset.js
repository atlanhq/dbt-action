import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";

dotenv.config();

const ATLAN_INSTANCE_URL =
  core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
  core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export default async function getAssetByExactName(name) {
  var myHeaders = {
    Authorization: `Bearer ${ATLAN_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  var raw = JSON.stringify({
    dsl: {
      from: 0,
      size: 1,
      query: {
        bool: {
          must: [
            {
              match: {
                __state: "ACTIVE",
              },
            },
            {
              match: {
                "__typeName.keyword": "DbtModel",
              },
            },
            {
              match: {
                "name.keyword": name,
              },
            },
          ],
        },
      },
    },
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  var response = await fetch(
    `${ATLAN_INSTANCE_URL}/api/meta/search/indexsearch#findAssetByExactName`,
    requestOptions
  ).then((e) => e.json());

  return response.entities[0];
}
