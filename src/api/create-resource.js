import {v4 as uuidv4} from "uuid";
import fetch from "node-fetch";
import core from "@actions/core";
import dotenv from "dotenv";
import {sendSegmentEventOnGithub} from "./index.js";
import stringify from 'json-stringify-safe';

dotenv.config();

const ATLAN_INSTANCE_URL =
    core.getInput("ATLAN_INSTANCE_URL") || process.env.ATLAN_INSTANCE_URL;
const ATLAN_API_TOKEN =
    core.getInput("ATLAN_API_TOKEN") || process.env.ATLAN_API_TOKEN;

export default async function createResource(guid, name, link) {
    var myHeaders = {
        Authorization: `Bearer ${ATLAN_API_TOKEN}`,
        "Content-Type": "application/json",
    };

    var raw = stringify({
        entities: [
            {
                typeName: "Link",
                attributes: {
                    qualifiedName: uuidv4(),
                    name,
                    link,
                    tenantId: "default",
                },
                relationshipAttributes: {
                    asset: {
                        guid,
                    },
                },
            },
        ],
    });

    var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    var response = await fetch(
        `${ATLAN_INSTANCE_URL}/api/meta/entity/bulk`,
        requestOptions
    ).then((e) => e.json()).catch(err => {
        console.log(err)
        sendSegmentEventOnGithub("dbt_ci_action_failure", {
            reason: 'failed_to_create_resource',
            asset_name: name,
            msg: err
        });
    })

    return response;
}
