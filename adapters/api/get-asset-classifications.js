import {
    ATLAN_API_TOKEN,
    ATLAN_INSTANCE_URL,
} from "../utils/get-environment-variables.js";

import fetch from "node-fetch";

export default async function getAssetClassifications() {
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
        return {
          error: err
        }
      });
    if (response.error) return response
  
    return response?.classificationDefs;
  }