# Atlan dbt Action

![atlan<>dbt](https://user-images.githubusercontent.com/14099191/209542321-54d5557e-8abf-4d9a-9f6d-dcacb856f25f.png)

## Overview

*Have you changed a dbt model and realised that it broke a table or a dashboard downstream 💔?*

To solve that, we’ve created a GitHub action that will add Atlan's lineage context right in your pull request. So before
merging the PR, you know the downstream impact of the change. Here's how it'll look like 👇

![Github Action comment screenshot](https://iili.io/HI7d0zB.png)

## Prerequisites

- **Atlan API key** → [How to create Atlan api key.](https://ask.atlan.com/hc/en-us/articles/8312649180049)

## How to setup

1. Set Atlan Instance URL and API Token as repository secrets in your repository.
    1. [How to set GitHub Action secrets in your repository.](https://github.com/Azure/actions-workflow-samples/blob/master/assets/create-secrets-for-GitHub-workflows.md#creating-secrets)

       ![Actions Secrets Screenshot](https://iili.io/HI7gfx2.png)

2. Add the GitHub Action to your workflow
    1. Create a file in the root directory of your repository, `.github/workflows/atlan-action.yml`
    2. Add the following code to your workflow file.

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
                uses: atlanhq/dbt-action@v1-beta
                with:
                  GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
                  ATLAN_INSTANCE_URL: ${{secrets.ATLAN_INSTANCE_URL}}
                  ATLAN_API_TOKEN: ${{secrets.ATLAN_API_TOKEN}}
        
        ```

## How to test

After you've completed both steps in setup, try creating a PR where you've changed any model file. You'll see Atlan
Github action running in action and adding comments in your pull request.

## Inputs

| Name               | Description                                                                                                                                                                     | Required |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| GITHUB_TOKEN       | Needed to write comments on PRs to print all the downstream assets. https://dev.to/github/the-githubtoken-in-github-actions-how-it-works-change-permissions-customizations-3cgp | true     |
| ATLAN_INSTANCE_URL | Needed for making API requests to the user's tenant.                                                                                                                            | true     |
| ATLAN_API_TOKEN    | Needed for authenticating API requests to the user's tenant. https://ask.atlan.com/hc/en-us/articles/8312649180049                                                              | true     |
