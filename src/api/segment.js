import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import {context} from "@actions/github";
import stringify from 'json-stringify-safe';

dotenv.config();

const {IS_DEV} = process.env;
const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
    core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export async function sendSegmentEvent(body) {
    const myHeaders = {
        authorization: `Bearer ${ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: body,
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
    }

    return response;
}

export async function sendSegmentEventOnGithub(action, properties) {
    const domain = new URL(ATLAN_INSTANCE_URL).hostname;

    const raw = stringify({
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

    return sendSegmentEvent(raw)
}

export async function sendSegmentEventOnGitlab(action, properties) {
    const domain = new URL(ATLAN_INSTANCE_URL).hostname;
    const {CI_PROJECT_PATH, CI_PIPELINE_ID} = process.env;

    const raw = stringify({
        category: "integration",
        object: "gitlab",
        action,
        userId: "atlan-annonymous-github",
        properties: {
            ...properties,
            gitlab_action_id: `https://gitlab.com/${CI_PROJECT_PATH}/pipelines/${CI_PIPELINE_ID}`,
            domain,
        },
    });

    return sendSegmentEvent(raw)
}