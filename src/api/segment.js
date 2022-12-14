import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import {context} from "@actions/github";

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

    var domain = new URL(ATLAN_INSTANCE_URL).hostname;

    var raw = JSON.stringify({
        category: "integrations",
        object: "github",
        action,
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

    var response = await fetch(
        `${ATLAN_INSTANCE_URL}/api/service/segment/track`,
        requestOptions
    )
        .then(() => {
            console.log("send segment event", action, raw);
        })
        .catch((err) => {
            console.log("couldn't send segment event", err);
        });

    return response;
}
