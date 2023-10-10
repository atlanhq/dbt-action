// main.js
import dotenv from "dotenv";
import { runAction } from "./gateway.js";
import GitHubIntegration from "./integrations/github-integration.js";
import GitLabIntegration from "./integrations/gitlab-integration.js";
import core from "@actions/core";

dotenv.config();

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN") || process.env.GITHUB_TOKEN;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

async function run() {
  //Add new integrations over here
  console.log("oii");
  await runAction(GITHUB_TOKEN, GitHubIntegration);
  await runAction(GITLAB_TOKEN, GitLabIntegration);
}

run();
