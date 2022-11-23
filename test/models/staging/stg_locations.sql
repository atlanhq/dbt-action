
{{ config(alias='stg_locations') }}

with source as (

    select * from fivetran.dbt_demo_data_dbt_demo_data.locations

),

renamed as (

    select

        ----------  ids
        id as location_id,

        ---------- properties
        name as location_name,
        tax_rate,

        ---------- timestamp
        opened_at

    from source

)

select * from renamed