import fetch from "node-fetch";
import {context} from "@actions/github";
import stringify from 'json-stringify-safe';
import {isDev, getAPIToken, getInstanceUrl} from "../utils/index.js";

const IS_DEV = isDev();
const ATLAN_INSTANCE_URL =
    getInstanceUrl();
const ATLAN_API_TOKEN =
    getAPIToken();

export default async function sendSegmentEvent(action, properties) {
    var myHeaders = {
        authorization: `Bearer ${ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    var domain = new URL(ATLAN_INSTANCE_URL).hostname;

    var raw = stringify({
        category: "integration",
        object: "github",
        action,
        userId: "atlan-annonymous-github",
        properties: {
            ...properties,
            github_action_id: `https://github.com/${context.payload.repository.full_name}/actions/runs/${context.runId}`,
            domain,
        },
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var response = null

    if (!IS_DEV) {
        response = await fetch(
            `${ATLAN_INSTANCE_URL}/api/service/segment/track`,
            requestOptions
        )
            .then(() => {
                console.log("send segment event", action, raw);
            })
            .catch((err) => {
                console.log("couldn't send segment event", err);
            });
    } else {
        console.log("send segment event", action, raw);
    }

    return response;
}
