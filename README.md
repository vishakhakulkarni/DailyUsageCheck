# DailyUsageCheck
A short function to be used by google cloud platform users. This helps set up a cloud function that runs daily and notifies the user in case the usage for the last day was more than X% of dailyaverage.

## Overview

This is a cloud function written in node.js to be used by Google Cloud Platform users. The cloud function is designed to run daily. When it runs it fetches billing data from BigQuery, calculates the daily average over a period on "n". It also get the billing data for the last 24 hours and sends an email notification to configured email ids in case the usage for the last 24 hours goes beyond "p" percent.

*Note:* Currently this considers only the cost and not the discounts or credits.

#### Prerequisites

1. Billing Exports must be set to BigQuery.
2. Service account must have read only access to BigQuery dataset
3. You must have a sendgrid account and an API-KEY for sendgrid.

Please refer to the following links to set this
* [Billing Export] (https://cloud.google.com/billing/docs/how-to/export-data-bigquery)
* [Sendgrid Setup] (https://sendgrid.com/docs/ui/account-and-settings/api-keys/)


#### Details

This repository contains the following the following files

* index.js 
* package.json
* env.yaml
* commands.txt

For the function to work the following steps need to be taken:

1. Create a pub/sub topic
2. Create a scheduler to run daily at midnight and publish a message to the above topic
3. Deploy the function to listen on the above topic.

The gcloud commands to perform the above steps are provided in **commands.txt**

Before deploying, please update the **env.yaml** and provide following details:

1. DATASET : This is the full table name where the billing data is exported. This should be provided in legacy SQL format i.e. [projectname:datasetname.tablename] e.g. [bigquery-samples:airline_ontime_data.flights]
2. PERCENT: If the daily usage value goes above this provided percent, an email will be sent.
3. AVERAGE_DAYS: The number of days to considered in calculating the average.
4. SENDGRID_KEY: The API key provided by sendgrid after registering.
5. FROM_EMAIL: The email id to be used in the "to:" of the mail being sent
6. TO_EMAIL: The email id who receives the alert notification.




