import {getConnectorImage, getImageURL} from "../utils/index.js"

export function getErrorModelNotFound(name) {
  return `
 <br>❌ Model with name **${name}** could not be found or is deleted <br><br>
  `;
}

export function getErrorAssetNotFound(name) {
  return `### Asset: **${name}**
  :warning: It seems that the underlying asset you were working with could not be found on Atlan. This could mean the asset is not synced or is currently unavailable.
  To address this:
  • Check asset sync: Ensure that the relevant assets are catalogued in Atlan.
  • Review asset source: Double-check the source database or data pipeline to ensure all upstream data is flowing correctly.
  `;
}

export function getErrorDoesNotMaterialize(
  name,
  ATLAN_INSTANCE_URL,
  response,
  integration
) {

  return `
<br>❌ Model with name [${name}](${ATLAN_INSTANCE_URL}/assets/${response.entities[0].guid}/overview?utm_source=dbt_${integration}_action) does not materialise any asset <br><br>`;
}

export function getNewModelAddedComment(fileName) {
  return `### ${getConnectorImage("dbt")} <b>${fileName}</b> 🆕
  Its a new model and not present in Atlan yet, you'll see the downstream impact for it after its present in Atlan.`
}

export function getBaseComment(totalChangedFiles, comments) {
  return `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
  Here is your downstream impact analysis for **${totalChangedFiles} ${
        totalChangedFiles > 1 ? "models" : "model"
      }** you have edited.
  
  ${comments}`
}

export function getContractImpactAnalysisBaseComment(
  totalChangedFiles, 
  comments,
  warningComments
) {
  return `### ${getImageURL("atlan-logo", 15, 15)} Atlan impact analysis
  We've detected changes in **${totalChangedFiles} ${
        totalChangedFiles > 1 ? "contracts" : "contract"
      }** that you've edited. Below is the downstream impact analysis of these changes.
  
  ${comments}
  
  ${warningComments}
  `
}