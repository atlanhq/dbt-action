# Setup and Test action locally

In order to test this project locally, we are using [act](https://github.com/nektos/act) by [nektos](https://github.com/nektos).

It is a very useful and easy to use library, which runs your Github Actions locally within a [docker container](https://www.docker.com/resources/what-container/) in order to test workflows without creating a mess on your github repository. It simulates events on Github and you can pass events explicitly in order to test your action exactly how it would behave on Github.

## Prerequisites

- `act` depends on `docker` to run workflows.
  - [Install on macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Install on Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Install on Linux](https://docs.docker.com/desktop/install/linux-install/)
- [Install `act` on your machine](https://github.com/nektos/act#installation-through-package-managers).

## Create `.env` file

- Copy `.env.example` to `.env`.
  ```
  cp .env.example .env
  ```
- Set the proper environment variables in your `.env` file.

  ```
  GITHUB_TOKEN={{Your Github Personal Access Token for local use only}}
  ATLAN_INSTANCE_URL={{Atlan instance URL, to be set as a repository secret.}}
  ATLAN_API_TOKEN={{Atlan Bearer token, to be set as a repository secret.}}
  IS_DEV=true
  ```

## Create `event.json` to test the action locally

Since you as a developer would be using your Github PAT to test the action locally, you'll need to locally run the clone of your fork, in order to generate the event.json file, follow the following steps:

- [Fork this repo.](https://github.com/atlanhq/dbt-action/fork)
- Create a pull request from `test-action` branch to `main` branch. Once you do so, it will automatically run the action.
- Go to your forked repo's `Actions` page and open the workflow with the name `Test Action`.
- Click on the one and only job, `Get Downstream Assets`.
- Click on the step called `Dump GitHub Context` and you'll find a huge json object containing the key `"event"`, copy all of the content present inside this key.
- Create `event.json` in your root directory.
- Paste all the content you copied in this file
  ```json
  {
    // ... Paste your copied content ...
  }
  ```

## Test Action Locally

Test on macOS with Apple Silicon processors.

```
act pull_request --container-architecture linux/amd64 --secret-file .env -e event.json
```

Drop the `--container-architecture linux/amd64` if you're using a mac with Intel processors or any other Windows/Linux based machines.

Once and if `act` is setup properly, then you can simply use the command `npm start` in order to run the above command.

## Contributing

Please make sure to use the command `npm run sync` in order to sync changes, since the workflow [`.github/workflows/package-action.yml`](https://github.com/atlanhq/dbt-action/blob/main/.github/workflows/package-action.yml) updates the `dist/` in order to package the action code in case you forget to package the action before pushing.
