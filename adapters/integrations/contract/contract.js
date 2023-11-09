// Common interface that each new integration has to implement
export default class IntegrationInterface {
  constructor(token) {
    this.token = token;
  }

  async run() {
    throw new Error("Not Implemented");
  }

  async printDownstreamAssets(config) {
    throw new Error("Not Implemented");
  }

  async setResourceOnAsset(config) {
    throw new Error("Not Implemented");
  }

  async authIntegration(config) {
    throw new Error("Not Implemented");
  }

  async sendSegmentEventOfIntegration({ action, properties }) {
    throw new Error("Not Implemented");
  }

  async getChangedFiles(config) {
    throw new Error("Not Implemented");
  }

  async getAssetName(config) {
    throw new Error("Not Implemented");
  }

  async getFileContents(config) {
    throw new Error("Not Implemented");
  }

  async checkCommentExists(config) {
    throw new Error("Not Implemented");
  }

  async createIssueComment(config) {
    throw new Error("Not Implemented");
  }

  async deleteComment(config) {
    throw new Error("Not Implemented");
  }

  async renderDownstreamAssetsComment() {
    throw new Error("Not Implemented");
  }
}
