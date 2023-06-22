# Atlan dbt Action

![atlan<>dbt](https://user-images.githubusercontent.com/14099191/209542321-54d5557e-8abf-4d9a-9f6d-dcacb856f25f.png)

## Overview

_Have you ever changed a dbt model only to later find it broke a downstream table or dashboard? 💔_

We've created a GitHub Action to help you out — putting Atlan's impact analysis right into your pull request. So now, before merging the PR, you can see the potential downstream impact of your changes.

Here's what it looks like 👇

![GitHub Action comment screenshot](https://iili.io/HI7d0zB.png)

## Prerequisites

- **Atlan API token** → before you can run the action, you need an [Atlan API token](https://ask.atlan.com/hc/en-us/articles/8312649180049).

## Configure the action

1. Create [repository secrets](https://github.com/Azure/actions-workflow-samples/blob/master/assets/create-secrets-for-GitHub-workflows.md#creating-secrets) in your repository:

   - `ATLAN_INSTANCE_URL` with the URL of your Atlan instance.
   - `ATLAN_API_TOKEN` with the value of the API token.

   ![Actions Secrets Screenshot](https://iili.io/HI7gfx2.png)

2. Add the GitHub Action to your workflow:

   1. Create a workflow file in your repository: `.github/workflows/atlan-dbt.yml`
   2. Add the following code to the workflow file:

      ```yaml
      name: Atlan dbt action

      on:
        pull_request:
          types: [opened, edited, synchronize, reopened, closed]

      jobs:
        get-downstream-impact:
          name: Get Downstream Assets
          runs-on: ubuntu-latest
          steps:
            - name: Run Action
              uses: atlanhq/dbt-action@v1
              with:
                GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
                ATLAN_INSTANCE_URL: ${{secrets.ATLAN_INSTANCE_URL}}
                ATLAN_API_TOKEN: ${{secrets.ATLAN_API_TOKEN}}
      ```

## Test the action

After you've completed the configuration above, create a pull request with a changed dbt model file to test the action. You should see the Atlan GitHub action running and then adding comments in your pull request:

- The GitHub workflow will add and update a single comment for every file change.
- The impacted assets in the comment will be displayed in a collapsible section and grouped by source and asset type.
- The comment will include some metadata for your impacted assets — such as descriptions, owners, and linked glossary terms.
- View the impacted assets in Atlan or open the source URL — for example, view an impacted Looker dashboard directly in Looker.

## Inputs

| Name                          | Description                                                                                                                                                                                                                                                                                                                     | Required | Default |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| `GITHUB_TOKEN`                | Needed to write comments on PRs to print all the downstream assets. https://dev.to/github/the-githubtoken-in-github-actions-how-it-works-change-permissions-customizations-3cgp                                                                                                                                                 | true     |
| `ATLAN_INSTANCE_URL`          | Needed for making API requests to the user's tenant.                                                                                                                                                                                                                                                                            | true     |
| `ATLAN_API_TOKEN`             | Needed for authenticating API requests to the user's tenant. https://ask.atlan.com/hc/en-us/articles/8312649180049                                                                                                                                                                                                              | true     |
| `DBT_ENVIRONMENT_BRANCH_MAP`  | Map Github branch with specific dbt environment, if you do this - Atlan Github action will pick lineage for that specific environment from Atlan.You can provide the mapping like `branch name`: `dbt environment name`. <br><br>main: DBT-DEMO-PROD<br>beta: Wide World Importers PE1<br>test-action: Wide World Importers PE1 | false    |
| `IGNORE_MODEL_ALIAS_MATCHING` | By default the action checks if there's an alias defined for a model in the code and looks for the relevant asset in Atlan using that alias. You can turn off matching alias name using this variable.                                                                                                                          | false    | false   |

## FAQs

### Action does not get the model from the correct environment?

In case there are multiple dbt models in your Atlan instance with the same name but in different environments, the action may get the wrong model. To fix this, you can map Github branch with specific dbt environment, if you do this - Atlan Github action will pick lineage for that specific environment from Atlan.
You can provide the mapping like `branch name`: `dbt nvironment name`

```diff
jobs:
  get-downstream-impact:
    name: Get Downstream Assets
    runs-on: ubuntu-latest
    steps:
      - name: Run Action
        uses: atlanhq/dbt-action@v1
        with:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
          ATLAN_INSTANCE_URL: ${{secrets.ATLAN_INSTANCE_URL}}
          ATLAN_API_TOKEN: ${{secrets.ATLAN_API_TOKEN}}
+         DBT_ENVIRONMENT_BRANCH_MAP: |
+           main: dbt-prod
+           beta: dbt-test
```

### Action gets model by alias and not by model name?

By default the action checks if there's an alias defined for a model in the code and looks for the relevant asset in Atlan using that alias. You can turn off matching alias name using this input `IGNORE_MODEL_ALIAS_MATCHING` input to true. For example:

```diff
jobs:
  get-downstream-impact:
    name: Get Downstream Assets
    runs-on: ubuntu-latest
    steps:
      - name: Run Action
        uses: atlanhq/dbt-action@v1
        with:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
          ATLAN_INSTANCE_URL: ${{secrets.ATLAN_INSTANCE_URL}}
          ATLAN_API_TOKEN: ${{secrets.ATLAN_API_TOKEN}}
+         IGNORE_MODEL_ALIAS_MATCHING: true
```
