import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import {sendSegmentEvent} from "./index.js";
import {createIssueComment, getConnectorImage, getCertificationImage, getImageURL} from "../utils/index.js";
import stringify from 'json-stringify-safe';

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

    var raw = stringify({
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

    var handleError = (err) => {
        const comment = `### ${getConnectorImage(asset.attributes.connectorName)} [${
            asset.displayText
        }](${ATLAN_INSTANCE_URL}/assets/${asset.guid}?utm_source=dbt_github_action) ${
            asset.attributes?.certificateStatus
                ? getCertificationImage(asset.attributes.certificateStatus)
                : ""
        }
            
❌ Failed to fetch impacted assets.
            
[${getImageURL('atlan-show-lineage-button', 30, 135)}](${ATLAN_INSTANCE_URL}/assets/${asset.guid}/lineage?utm_source=dbt_github_action)`;

        sendSegmentEvent("dbt_ci_action_failure", {
            reason: 'failed_to_fetch_lineage',
            asset_guid: asset.guid,
            asset_name: asset.name,
            asset_typeName: asset.typeName,
            msg: err
        });

        return comment
    }

    var response = await fetch(
        `${ATLAN_INSTANCE_URL}/api/meta/lineage/getlineage`,
        requestOptions
    ).then((e) => {
        if (e.status === 200) {
            return e.json();
        } else {
            throw e;
        }
    }).catch((err) => {
        return {
            error: handleError(err)
        }
    });

    if (response.error) return response;

    if (!response?.relations) return [];

    const relations = response.relations.map(({toEntityId}) => toEntityId);

    return relations
        .filter((id, index) => relations.indexOf(id) === index)
        .map((id) => response.guidEntityMap[id]);
}
