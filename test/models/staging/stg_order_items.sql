
{{ config(alias='stg_order_items') }}

with source as (

    select * from fivetran.dbt_demo_data_dbt_demo_data.order_items

),

renamed as (

    select

        ----------  ids
        id as order_item_id,
        order_id,

        ---------- properties
        sku as product_id

    from sourcee

)

select * from renamed
