{{config(materialized         = 'incremental'
        ,incremental_strategy = 'merge'
        ,alias                = 'credit_consent_check_history'
        ,unique_key           = ['application_number','bureau_name','pulled_date']
        ,tags                 = ['genpact']
        )
}}

WITH 

/*
 * WHEN         WHO            WHAT 
 * ------------ -------------- --------------------------------------------------------------------------------------
 * 12-SEP-2024  PCROSS         SNF-7100 initial
 * 18-SEP-2024  JSTOPANSKY     SNF-7100 updating reference to external table instead of src table
 *
 * Note : table credit_consent_check_history is being incrementally updated ('merge') using data
 *        in external table EXT_CREDIT_CONSENT_CHECK_HISTORY.
 *        the external table is based on a csv file (genpact.csv) in AWS location "s3://prod-data-services-genpact/"
 *        the loaded data is type VARIANT -> convert to VARCHAR
 *
 */

ext AS (
      SELECT
             value:c1::VARCHAR           AS application_number
            ,value:c2::VARCHAR           AS report_status
            ,value:c3::VARCHAR           AS bureau_name_hierarchy
            ,value:c4::VARCHAR           AS bureau_name
            ,value:c5::VARCHAR           AS score_band
            ,value:c6::VARCHAR           AS application_status
            ,value:c7::VARCHAR           AS pulled_date
            ,value:c8::VARCHAR           AS application_created_date
            ,value:c9::VARCHAR           AS score
            ,value:c10::VARCHAR          AS application_final_decision_date
            ,value:c11::VARCHAR          AS application_last_modified_date
            ,value:c12::VARCHAR          AS state
            ,value:c13::VARCHAR          AS zip
            ,value:c14::VARCHAR          AS bureau_dob_year
            ,metadata$file_last_modified AS s3_last_modified_at
      FROM
            {{source('SRC_GENPACT','EXT_CREDIT_CONSENT_CHECK_HISTORY')}}
      {% if is_incremental() %}
      WHERE metadata$file_last_modified > (SELECT NVL(MAX(s3_last_modified_at), to_date('1999-01-01')) FROM {{this}})
      {% endif %}
)

SELECT
       ext.application_number
      ,ext.report_status
      ,ext.bureau_name_hierarchy
      ,ext.bureau_name
      ,ext.score_band
      ,ext.application_status
      ,ext.pulled_date
      ,ext.application_created_date
      ,ext.score
      ,ext.application_final_decision_date
      ,ext.application_last_modified_date
      ,ext.state
      ,ext.zip
      ,ext.bureau_dob_year
      ,ext.s3_last_modified_at
      ,current_timestamp()       AS loaded_at

FROM ext