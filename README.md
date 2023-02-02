# Atlan dbt Action

![atlan<>dbt](https://user-images.githubusercontent.com/14099191/209542321-54d5557e-8abf-4d9a-9f6d-dcacb856f25f.png)

## Overview

*Have you ever changed a dbt model only to later find it broke a downstream table or dashboard? 💔*

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
                uses: atlanhq/dbt-action@v1-beta
                with:
                  GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
                  ATLAN_INSTANCE_URL: ${{secrets.ATLAN_INSTANCE_URL}}
                  ATLAN_API_TOKEN: ${{secrets.ATLAN_API_TOKEN}}
        ```

## Test the action

To test the action, after you've completed the configuration above create a pull request with a changed dbt model file. You should see the Atlan
GitHub action running and then adding comments in your pull request.

## Inputs

| Name               | Description                                                                                                                                                                     | Required |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `GITHUB_TOKEN`       | Needed to write comments on PRs to print all the downstream assets. https://dev.to/github/the-githubtoken-in-github-actions-how-it-works-change-permissions-customizations-3cgp | true     |
| `ATLAN_INSTANCE_URL` | Needed for making API requests to the user's tenant.                                                                                                                            | true     |
| `ATLAN_API_TOKEN`    | Needed for authenticating API requests to the user's tenant. https://ask.atlan.com/hc/en-us/articles/8312649180049                                                              | true     |
