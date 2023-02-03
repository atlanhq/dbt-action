
{{ config(alias='stg_customers') }}

with source as (

    select * from fivetran.dbt_demo_data_dbt_demo_data.customers
),

renamed as (

    select

        ----------  ids
        id as customer_id,

        ---------- properties
        name as customer_name_2

    from source

)

select * from renamed
