## dbt demo data

This repository contains demo data and a starter project intended
for use with [dbt](www.getdbt.com).

> :warning: **This repo is a work-in-progress**: Best to come back sometime soon :)

### Installing source data

In order to use this demo dbt project, you must manually import data
into your data platform using the steps shown below.

#### Snowflake

- Assume a ROLE in your Snowflake account that permits you to create new databases, schemas, stages, and external tables
- Navigate to the [installation script](https://raw.githubusercontent.com/dbt-labs/dbt-demo-data/main/scripts/snowflake.sql) and copy the contents of this document
- Run the script and confirm that the transaction is committed successfully

After running the script, you may need to run GRANT statements manually depending on your
existing configuration in Snowflake. At a minimum, you will need to make sure
that role used by your dbt job is able to read from external tables in this
schema:

```
-- Change this DBT_ROLE value as needed
set DBT_ROLE='TRANSFORMER';

grant usage on database DBT_DEMO_DATA
    to role identifier($DBT_ROLE);

grant usage on schema DBT_DEMO_DATA.ECOMMERCE
    to role identifier($DBT_ROLE);

grant select on all external tables in schema DBT_DEMO_DATA.ECOMMERCE
    to role identifier($DBT_ROLE);
```

#### BigQuery

_Not implemented_

#### Redshift

_Not implemented_

#### Databricks

_Not implemented_

### Running this project

#### In dbt Cloud

To run this project in dbt Cloud:

- Make a fork of this repo in your own GitHub organization
- Import your forked repository into dbt Cloud
- Run a job in your dbt Cloud Deployment Environment with the command `dbt build`

Changes have been made to

stg_customers
fct_orders
