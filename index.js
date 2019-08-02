/**
 * Copyright 2019, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const {BigQuery} = require('@google-cloud/bigquery');
const sendgrid = require('@sendgrid/mail');

 
const fromEmail = process.env.FROM_EMAIL;
const toEmail = process.env.TO_EMAIL;
const dataset = process.env.DATASET;
const percentValue = process.env.PERCENT;
const sendGridKey = process.env.SENDGRID_KEY; 
const averageDays = process.env.AVERAGE_DAYS;


// Instantiate a datastore client
const bigquery = new BigQuery();

const sqlQuery =" select today, dailyAverage, (((today/dailyAverage) * 100) -100) as difference, \
if(((((today/dailyAverage) * 100) -100) > percent), 1, 0) as change, \
A.pname as projectName FROM \
( \
SELECT round(sum(cost) ,2) as today, project.name as pname \
FROM datasetName \
WHERE datediff(CURRENT_timestamp(), usage_start_time) = 1 group by pname ) A join \
( select round(((sum(total))/count(dayn)),2) as dailyAverage, pname FROM \
( \
SELECT sum(cost) as total,sum(credits.amount) as credittotal, dayofyear(usage_start_time) as dayn, \
project.name as pname FROM datasetName \
WHERE datediff(CURRENT_timestamp(), usage_start_time) <= averageDays group by pname , dayn \
) \
group by pname having dailyAverage > 0.0 \
) B on A.pname = B.pname "



exports.DailyUsageCheckFunction = async event => {
  	 var output = await checkDailyUsage(event);
     
}



async function checkDailyUsage(event) {

try {
      checkEnvironmentValues();
      var queryStr = sqlQuery.replace(/datasetName/g, dataset).replace(/percent/g, percentValue).replace(/averageDays/g, averageDays);
      
      var options = {
        query: queryStr,
        useLegacySql: true, 
      };

      const [job] = await bigquery.createQueryJob(options);
      console.log(`Job ${job.id} started.`);
  
      // Wait for the query to finish
      const [rows] = await job.getQueryResults();

      
      rows.forEach(row => processRow(row));
             
    } catch(err)
    {
      console.log(err);
      return err;
            
    }

}
            
async function processRow(row) {
    
      let today = row['today'];
      let average = row['dailyAverage'];
      let difference = row['difference'];
      let change = row['change'];
      let projectname = row['projectName'];

      //console.log(`today: ${today}, average: ${average} change: ${change} projectname = ${projectname} `);

      if(change == 1) {
        console.log("Sending email..");
        console.log(`today: ${today}, average: ${average} change: ${change} projectname = ${projectname} `);
        
        sendEmail(projectname, average, today, difference);
      }
 
 
 }
    

async function sendEmail(projectName, average, today, difference) {

  try {
      console.log("Sending mail..");
      sendgrid.setApiKey(sendGridKey);
      
      const msg = {
        to: toEmail,
        from: fromEmail,
        subject: 'Billing Alert',
        text: 'Dear User, \n You daily usage for project: ' + projectName + ' is ' + today + ' which is ' + difference + '% more than the daily average of ' + average    
      };

      sendgrid.send(msg);
    } catch(err)
    {
      console.log("err in sending mail " + err);
    }

  }

  function checkEnvironmentValues () {

    if(!dataset)  {
        throw new Error("Missing environment value for dataset"); 
    }

    if(!percentValue)  {
        throw new Error("Missing environment value for percentValue"); 
    }

    if(!averageDays)  {
        throw new Error("Missing environment value for averageNoDays"); 
    }

    if(!sendGridKey) {
        throw new Error("Missing environment value for sendgrid API Key"); 
    }

    if(!fromEmail) {
      throw new Error("Missing environment value for from email"); 
    }

    if(!toEmail) {
      throw new Error("Missing environment value for to email"); 
    }

 }



