import dotenv from "dotenv";
import core from "@actions/core";

dotenv.config();

const {
  IS_DEV,
  ATLAN_INSTANCE_URL,
  ATLAN_API_TOKEN,
  IGNORE_MODEL_ALIAS_MATCHING,
} = process.env;

export const isDev = () => IS_DEV === "true";
export const getInstanceUrl = () => {
  if (ATLAN_INSTANCE_URL) return new URL(ATLAN_INSTANCE_URL).origin;
  return new URL(core.getInput("ATLAN_INSTANCE_URL")).origin;
};
export const getAPIToken = () => {
  if (ATLAN_API_TOKEN) return ATLAN_API_TOKEN;
  return core.getInput("ATLAN_API_TOKEN");
};
export const getEnvironments = () => {
  return core.getInput("DBT_ENVIRONMENT_BRANCH_MAP")
    ? core
        .getInput("DBT_ENVIRONMENT_BRANCH_MAP")
        .trim()
        ?.split("\n")
        ?.map((i) => i.split(":").map((i) => i.trim()))
    : [];
};
export const isIgnoreModelAliasMatching = () =>
  core.getInput("IGNORE_MODEL_ALIAS_MATCHING") === "true";

export function getGitLabEnvironments() {
  const { DBT_ENVIRONMENT_BRANCH_MAP } = process.env;

  if (DBT_ENVIRONMENT_BRANCH_MAP) {
    const environmentLines = DBT_ENVIRONMENT_BRANCH_MAP.split("\n");
    const environmentMap = {};

    environmentLines.forEach((line) => {
      const [environment, branch] = line.split(":").map((item) => item.trim());
      if (environment && branch) {
        environmentMap[environment] = branch;
      }
    });

    return environmentMap;
  } else {
    return {};
  }
}
