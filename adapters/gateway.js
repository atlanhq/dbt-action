// Common Gateway for all integrations
export async function runAction(token, integrationModule) {
  if (token === undefined) {
    console.log("Token not provided.");
    return;
  }
  const integration = new integrationModule(token);
  await integration.run();
}
