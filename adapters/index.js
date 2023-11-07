// main.js
import { runAction } from "./gateway.js";
import GitHubIntegration from "./integrations/github-integration.js";
import GitLabIntegration from "./integrations/gitlab-integration.js";
import {
  GITLAB_TOKEN,
  GITHUB_TOKEN,
} from "./utils/get-environment-variables.js";

async function run() {
  //Add new integrations over here
  await runAction(GITHUB_TOKEN, GitHubIntegration);
  await runAction(GITLAB_TOKEN, GitLabIntegration);
}

run();
