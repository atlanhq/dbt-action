import dotenv from "dotenv";

import {Gitlab} from '@gitbeaker/node'

import core from "@actions/core";
import github from "@actions/github";

import {printIAonGithub, setResourceGithub, printIAonGitlab, setResourceGitlab} from "./main/index.js";
import {sendSegmentEventOnGithub, sendSegmentEventOnGitlab} from "./api/index.js";
import {authOnGithub, authOnGitlab} from "./utils/index.js";

dotenv.config();

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

async function runOnGithub() {
    console.log("Run Github")

    const timeStart = Date.now();
    const {context} = github;
    const octokit = github.getOctokit(GITHUB_TOKEN);
    const {pull_request} = context.payload;
    const {state, merged} = pull_request;

    if (!await authOnGithub(octokit, context)) throw {message: 'Wrong API Token'}

    let total_assets = 0;

    if (state === "open") {
        total_assets = await printIAonGithub({octokit, context});
    } else if (state === "closed") {
        if (merged) total_assets = await setResourceGithub({octokit, context});
    }

    if (total_assets !== 0)
        sendSegmentEventOnGithub("dbt_ci_action_run", {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
        });
}

async function runOnGitlab() {
    const timeStart = Date.now();
    console.log("Run Gitlab")

    const gitlab = new Gitlab({
        host: 'https://gitlab.com',
        token: GITLAB_TOKEN,
    });

    const {CI_PROJECT_ID, CI_MERGE_REQUEST_IID} = process.env

    if (!await authOnGitlab(gitlab)) throw {message: 'Wrong API Token'}

    const {state, web_url} = await gitlab.MergeRequests.show(CI_PROJECT_ID, CI_MERGE_REQUEST_IID)

    let total_assets = 0;

    if (state === "opened") {
        total_assets = await printIAonGitlab({gitlab});
    } else if (state === "merged") {
        total_assets = await setResourceGitlab({gitlab, web_url});
    }

    if (total_assets !== 0)
        sendSegmentEventOnGitlab("dbt_ci_action_run", {
            asset_count: total_assets,
            total_time: Date.now() - timeStart,
        });
}

async function run() {
    if (GITHUB_TOKEN) {
        await runOnGithub()
    }
    if (GITLAB_TOKEN) {
        await runOnGitlab()
    }
}

run().catch((err) => {
    if (GITHUB_TOKEN) {
        sendSegmentEventOnGithub("dbt_ci_action_failure", {
            reason: 'failed_to_run_action',
            msg: err
        });
    }
    if (GITLAB_TOKEN) {
        sendSegmentEventOnGitlab("dbt_ci_action_failure", {
            reason: 'failed_to_run_action',
            msg: err
        });
    }
    core.setFailed(err.message);
});
