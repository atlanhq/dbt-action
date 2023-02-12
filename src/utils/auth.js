import fetch from "node-fetch";
import dotenv from "dotenv";
import core from "@actions/core";
import {createIssueCommentOnGithub} from "./index.js";

dotenv.config();

const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
    core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

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
    ).catch((err) => {
    });

    return response
}

export async function authOnGithub(octokit, context) {
    const response = await auth()

    if (response?.status === 401) {
        await
            createIssueCommentOnGithub(octokit, context, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`)
        return false
    }

    if (response === undefined) {
        await
            createIssueCommentOnGithub(octokit, context, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`)
        return false
    }

    return true
}

export async function authOnGitlab(gitlab) {
    const response = await auth()

    if (response?.status === 401) {
        await
            createIssueCommentOnGitlab(gitlab, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`)
        return false
    }

    if (response === undefined) {
        await
            createIssueCommentOnGitlab(gitlab, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`)
        return false
    }

    return true
}