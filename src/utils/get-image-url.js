import hostedImages from "./hosted-images.js";

export function getImageURL(name) {
  try {
    return `![${hostedImages[name].alt}](${hostedImages[name].url})`;
  } catch (e) {
    console.log(name);
  }
}

export function getConnectorImage(connectorName) {
  return getImageURL(`connector-${connectorName.toLowerCase()}`);
}

export function getCertificationImage(certificationStatus) {
  return getImageURL(`certification-${certificationStatus.toLowerCase()}`);
}
