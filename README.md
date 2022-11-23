# Atlan dbt action

Get comments about downstream assets affected when you make changes to your dbt model SQL files.

## Prerequisites

- Login to your Atlan Instance.
- [Create Atlan Bearer Token.](https://ask.atlan.com/hc/en-us/articles/8312649180049)

## Usage

1. Set up your credentials as secrets in your repository settings using `ATLAN_INSTANCE_URL` and `ATLAN_API_TOKEN`.

2. Add the following to your workflow

   ```yml
   name: Atlan dbt action

   on:
     pull_request:
       types: [opened, edited, reopened]

   jobs:
     get-downstream-assets:
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

## Inputs

| Name                 | Description                                                                                                                                                                                                | Required |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `GITHUB_TOKEN`       | Needed to write comments on PRs to print all the downstream assets. [How Github Tokens work?](https://dev.to/github/the-githubtoken-in-github-actions-how-it-works-change-permissions-customizations-3cgp) | `true`   |
| `ATLAN_INSTANCE_URL` | Needed for making API requests to the user's tenant.                                                                                                                                                       | `true`   |
| `ATLAN_API_TOKEN`    | Needed for authenticating API requests to the user's tenant. [Create an Atlan Bearer Token.](https://ask.atlan.com/hc/en-us/articles/8312649180049)                                                        | `true`   |

## Setup

Check out the [documentation](https://github.com/atlanhq/dbt-action/blob/main/SETUP.md) for setting up this action and testing it locally.

## Third Party Licenses

This GitHub Action uses a couple of Node.js modules to work.

License and other copyright information for each module are included in the release branch of each action version under `node_modules/{module}`.

More information for each package can be found at `https://www.npmjs.com/package/{package}`

## License

[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
