
{{ config(materialized='table') }}

with customers as (

    select * from {{ ref('stg_customers') }}

),

orders as (

    select * from {{ ref('fct_orders') }}

),

order_summary as (

    select
        customer_id,

        count(*) as count_lifetime_orders,
        count(*) > 1 as is_repeat_buyer,
        min(ordered_at) as first_ordered_at,
        max(ordered_at) as last_ordered_at,

        sum(subtotal) as lifetime_spend_pretax,
        sum(order_total) as lifetime_spend

    from orders
    group by 1

),

joined as (

    select
        customers.*,
        order_summary.count_lifetime_orders,
        order_summary.first_ordered_at,
        order_summary.last_ordered_at,
        order_summary.lifetime_spend_pretax,
        order_summary.lifetime_spend,

        case
            when order_summary.is_repeat_buyer then 'returning'
            else 'new'
        end as customer_type

    from customers
    join order_summary using (customer_id)

)

select * from joined