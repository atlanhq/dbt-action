import dotenv from "dotenv";
import core from "@actions/core";
import github from "@actions/github";

import {printDownstreamAssets, setResourceOnAsset} from "./main/index.js";
import {sendSegmentEvent} from "./api/index.js";
import {auth} from "./utils/index.js";

dotenv.config();

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;

async function run() {
    const timeStart = Date.now();
    const {context} = github;
    const octokit = github.getOctokit(GITHUB_TOKEN);
    const {pull_request} = context.payload;
    const {state, merged} = pull_request;

    if (!await auth(octokit, context)) throw {message: 'Atlan Action Secrets not set properly.'}

    let total_assets = 0;

    if (state === "open") {
        total_assets = await printDownstreamAssets({octokit, context});
    } else if (state === "closed") {
        if (merged) total_assets = await setResourceOnAsset({octokit, context});
    }

    if (total_assets !== 0)
        sendSegmentEvent("dbt_ci_action_run", {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
        });
}

run().catch((err) => {
    sendSegmentEvent("dbt_ci_action_failure", {
        reason: 'failed_to_run_action',
        msg: err
    });

    core.setFailed(err.message);
});
