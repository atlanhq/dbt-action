import dotenv from "dotenv";
import core from "@actions/core";
import github from "@actions/github";

import { printDownstreamAssets } from "./main/index.js";

dotenv.config();

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;

async function run() {
  const { context } = github;
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { pull_request } = context.payload;
  const { state } = pull_request;
  console.log(pull_request);

  switch (state) {
    case "open":
      await printDownstreamAssets({ octokit, context });
      break;
    case "closed":
      console.log(pull_request);
  }
}

run().catch((e) => core.setFailed(e.message));
