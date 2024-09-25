import {
  GITHUB_TOKEN,
  GITLAB_TOKEN,
} from "./utils/get-environment-variables.js";

import ContractIntegration from "./integrations/atlan-contract-impact-analysis-github.js";
import GitHubIntegration from "./integrations/github-integration.js";
import GitLabIntegration from "./integrations/gitlab-integration.js";
// main.js
import { runAction } from "./gateway.js";

async function run() {
  //Add new integrations over here
  await runAction(GITHUB_TOKEN, ContractIntegration);
  await runAction(GITHUB_TOKEN, GitHubIntegration);
  await runAction(GITLAB_TOKEN, GitLabIntegration);
}

run();
