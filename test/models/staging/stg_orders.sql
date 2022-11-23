
{{ config(alias='stg_locations') }}

with source as (

    select * from fivetran.dbt_demo_data_dbt_demo_data.orders

),

renamed as (

    select

        ----------  ids
        id as order_id,
        location_id,
        customer_id,

        ---------- properties
        (order_total / 100.0)::float as order_total,
        (tax_paid / 100.0)::float as tax_paid,

        ---------- timestamps
        ordered_at

    from source

)

select * from renamed