import dotenv from "dotenv";
import core from "@actions/core";
import github from "@actions/github";

import { printDownstreamAssets, setResourceOnAsset } from "./main/index.js";
import { sendSegmentEvent } from "./api/index.js";

dotenv.config();

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;

async function run() {
  const timeStart = Date.now();
  const { context } = github;
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { pull_request } = context.payload;
  const { state, merged } = pull_request;

  let total_assets = 0;

  if (state === "open") {
    total_assets = await printDownstreamAssets({ octokit, context });
  } else if (state === "closed") {
    if (merged) await setResourceOnAsset({ octokit, context });
  }

  sendSegmentEvent("dbt_ci_action_run", {
    asset_count: total_assets,
    total_time: Date.now() - timeStart,
  });
}

run().catch((e) => {
  core.setFailed(e.message);
});
