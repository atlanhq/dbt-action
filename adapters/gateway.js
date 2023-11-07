// Common Gateway for all integrations
import logger from "./logger/logger.js";
export async function runAction(token, integrationModule) {
  if (token === undefined) {
    logger.logInfo("Token not provided.", "runAction");
    return;
  }
  const integration = new integrationModule(token);
  await integration.run();
}
