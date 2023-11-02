import fetch from "node-fetch";
import {checkCommentExists, createIssueComment} from "./create-comment.js";
import {getAPIToken, getInstanceUrl} from "./get-environment-variables.js";

const ATLAN_INSTANCE_URL =
    getInstanceUrl()
const ATLAN_API_TOKEN =
    getAPIToken();

export default async function auth(octokit, context) {
    var myHeaders = {
        authorization: `Bearer ${ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    var requestOptions = {
        method: "GET",
        headers: myHeaders,
    };

    var response = await fetch(
        `${ATLAN_INSTANCE_URL}/api/service/whoami`,
        requestOptions
    ).catch((err) => {
    });

    const existingComment = await checkCommentExists(octokit, context);

    console.log("Existing Comment", existingComment)

    if (response?.status === 401) {
        await
            createIssueComment(octokit, context, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`, existingComment?.id)
        return false
    }

    if (response === undefined) {
        await
            createIssueComment(octokit, context, `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's action secret. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}

Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`

Set your repository action secrets [here](https://github.com/${context.payload.repository.full_name}/settings/secrets/actions). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://github.com/atlanhq/dbt-action/blob/main/README.md).`, existingComment?.id)
        return false
    }

    return true
}
