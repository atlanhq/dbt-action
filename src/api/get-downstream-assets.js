import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import {sendSegmentEvent} from "./index.js";
import {createCustomComment, getConnectorImage, getCertificationImage} from "../utils/index.js";

dotenv.config();

const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
    core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export default async function getDownstreamAssets(asset, guid, octokit, context) {
    var myHeaders = {
        authorization: `Bearer ${ATLAN_API_TOKEN}`,
        "content-type": "application/json",
    };

    var raw = JSON.stringify({
        depth: 21,
        guid: guid,
        hideProcess: true,
        allowDeletedProcess: false,
        entityFilters: {
            attributeName: "__state",
            operator: "eq",
            attributeValue: "ACTIVE",
        },
        attributes: [
            "name",
            "description",
            "userDescription",
            "sourceURL",
            "qualifiedName",
            "connectorName",
            "certificateStatus",
            "certificateUpdatedBy",
            "certificateUpdatedAt",
            "ownerUsers",
            "ownerGroups",
            "classificationNames",
            "meanings",
        ],
        direction: "OUTPUT",
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var handleError = async (err) => {
        const comment = `## ${getConnectorImage(asset.attributes.connectorName)} [${
            asset.displayText
        }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=github) ${
            asset.attributes?.certificateStatus
                ? getCertificationImage(asset.attributes.certificateStatus)
                : ""
        }
\`${asset.typeName
            .toLowerCase()
            .replace(asset.attributes.connectorName, "")
            .toUpperCase()}\`
            
❌ Failed to fetch downstream impacted assets.
            
[See lineage on Atlan.](${ATLAN_INSTANCE_URL}/assets/${asset.guid}/lineage?utm_source=github)`;

        createCustomComment(octokit, context, comment)

        sendSegmentEvent("dbt_ci_action_failure", {
            reason: 'failed_to_fetch_lineage',
            asset_guid: asset.guid,
            asset_name: asset.name,
            asset_typeName: asset.typeName,
            msg: err
        });
    }

    var response = await fetch(
        `${ATLAN_INSTANCE_URL}/api/meta/lineage/getlineage`,
        requestOptions
    ).then((e) => e.json()).catch((err) => {
        handleError(err)
    });

    if (!!response.error) {
        handleError(response.error)
    }

    if (!response?.relations) return [];

    const relations = response.relations.map(({toEntityId}) => toEntityId);

    return relations
        .filter((id, index) => relations.indexOf(id) === index)
        .map((id) => response.guidEntityMap[id]);
}
