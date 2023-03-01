import {hostedImages} from "./index.js";

export function getImageURL(name, height = 20, width = 20) {
    try {
        return `<img src="${hostedImages[name].url}" alt="${hostedImages[name].alt}" height="${height}" width="${width}"/>`;
    } catch (e) {
        console.log(name);
        return '';
    }
}

export function getConnectorImage(connectorName) {
    return getImageURL(`connector-${connectorName.toLowerCase()}`, 15, 15);
}

export function getCertificationImage(certificationStatus) {
    return getImageURL(`certification-${certificationStatus.toLowerCase()}`, 15, 15);
}
