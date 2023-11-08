import { getImageURL, getConnectorImage, getCertificationImage } from "../utils/index.js";

export function getErrorResponseStatus401 (ATLAN_INSTANCE_URL, CI_PROJECT_NAME, CI_PROJECT_NAMESPACE) {
    return `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Bearer Token as \`ATLAN_API_TOKEN\` as this repository's CI/CD variable. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}
    
Set your CI/CD variables [here](https://gitlab.com/${CI_PROJECT_NAMESPACE}/${CI_PROJECT_NAME}/-/settings/ci_cd). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://ask.atlan.com/hc/en-us/articles/8284983222415).`
}

export function getErrorResponseStatusUndefined(ATLAN_INSTANCE_URL, CI_PROJECT_NAME, CI_PROJECT_NAMESPACE) {
    return `We couldn't connect to your Atlan Instance, please make sure to set the valid Atlan Instance URL as \`ATLAN_INSTANCE_URL\` as this repository's CI/CD variable. 

Atlan Instance URL: ${ATLAN_INSTANCE_URL}
    
Make sure your Atlan Instance URL is set in the following format.
\`https://tenant.atlan.com\`
    
Set your CI/CD variables [here](https://gitlab.com/${CI_PROJECT_NAMESPACE}/${CI_PROJECT_NAME}/-/settings/ci_cd). For more information on how to setup the Atlan dbt Action, please read the [setup documentation here](https://ask.atlan.com/hc/en-us/articles/8284983222415).`
}

export function getSetResourceOnAssetComment(tableMd, setResourceFailed) {
    return `## 🎊 Congrats on the merge!
  
  This pull request has been added as a resource to the following assets:
    
  ${setResourceFailed ? '> ⚠️  Seems like we were unable to set the resources for some of the assets due to insufficient permissions. To ensure that the pull request is linked as a resource, you will need to assign the right persona with requisite permissions to the API token.' : ''}
    
  Name | Resource set successfully
  --- | ---
  ${tableMd}
  `
}

export function getAssetInfo(ATLAN_INSTANCE_URL, asset, materialisedAsset, environmentName, projectName) {
  return `### ${getConnectorImage(
      asset.attributes.connectorName
    )} [${asset.displayText}](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }/overview?utm_source=dbt_gitlab_action) ${
      asset.attributes?.certificateStatus
        ? getCertificationImage(asset.attributes.certificateStatus)
        : ""
    }
Materialised asset: ${getConnectorImage(
      materialisedAsset.attributes.connectorName
    )} [${materialisedAsset.attributes.name}](${ATLAN_INSTANCE_URL}/assets/${
      materialisedAsset.guid
    }/overview?utm_source=dbt_gitlab_action) ${
      materialisedAsset.attributes?.certificateStatus
        ? getCertificationImage(materialisedAsset.attributes.certificateStatus)
        : ""
    }${environmentName ? ` | Environment Name: \`${environmentName}\`` : ""}${
      projectName ? ` | Project Name: \`${projectName}\`` : ""
    }`
}

export function getDownstreamTable(ATLAN_INSTANCE_URL, downstreamAssets, rows, materialisedAsset) {
  return `<details><summary><b>${
      downstreamAssets.entityCount
    } downstream assets 👇</b></summary><br/>

Name | Type | Description | Owners | Terms | Classifications | Source URL
--- | --- | --- | --- | --- | --- | ---
${rows
  .map((row) =>
    row.map((i) => i.replace(/\|/g, "•").replace(/\n/g, "")).join(" | ")
  )
  .join("\n")}

${
  downstreamAssets.hasMore
    ? `[See more downstream assets at Atlan](${ATLAN_INSTANCE_URL}/assets/${materialisedAsset.guid}/lineage?utm_source=dbt_gitlab_action)`
    : ""
}

</details>`
}

export function getViewAssetButton(ATLAN_INSTANCE_URL, asset) {
  return `${getImageURL(
      "atlan-logo",
      15,
      15
    )} [View asset in Atlan](${ATLAN_INSTANCE_URL}/assets/${
      asset.guid
    }/overview?utm_source=dbt_gitlab_action)`
}

export function getMDCommentForModel(ATLAN_INSTANCE_URL, model) {
  return `${getConnectorImage(model?.attributes?.connectorName)} [${
      model?.displayText
    }](${ATLAN_INSTANCE_URL}/assets/${model?.guid}/overview?utm_source=dbt_gitlab_action)`
}

export function getMDCommentForMaterialisedView(ATLAN_INSTANCE_URL, materialisedView) {
  return `${getConnectorImage(materialisedView?.attributes?.connectorName)} [${
      materialisedView?.attributes?.name
    }](${ATLAN_INSTANCE_URL}/assets/${materialisedView?.guid}/overview?utm_source=dbt_gitlab_action)`
}

export function getTableMD(md, resp) {
  return `${md} | ${resp ? '✅' : '❌'} \n`
}