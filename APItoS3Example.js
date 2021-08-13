const axios = require("axios");
const csvjson = require('csvjson');
const writeFile = require('fs').writeFile;
const fs = require('fs');
const AWS = require('aws-sdk');
const cron = require('node-cron');


// Access Token for website
var config = {
    method: 'get',
    headers: { 
      'Authorization': 'Bearer token'
    }
  };

  async function downloadRecords() {

    var records = [];
    var page = 1;
    var per_page = 100;
  
//Pagination to get all pages
    do {
        let { data: response }  = await axios.get(`address&page=${page++}&per_page=${per_page}`, config);
        totalPages = response.pagination.total_pages;
        mydata =  JSON.parse(JSON.stringify(response.suggestions));
        records.push(mydata); 
 
       
    } while (page <= totalPages)
//Downloads Data & writes to CSV
    console.log("downloadRecords: download complete."+ records.length)
    const csvData = csvjson.toCSV(records, {     
        headers: 'False'
    });
  

    writeFile('./myfile.csv', csvData, (err) => {
        if(err) {
            console.log(err); // Do something to handle the error or just throw it
        }
        console.log('Success!');
    });
}

//Daily Scheduler to run it
cron.schedule('45 9 * * *', function() {
    downloadRecords()
    console.log('Ran at 9 45');
  });
  

async function main() {
    try {
      var quote = await downloadRecords();
      uploadFile();
    } catch(error) {
      console.error(error);
    }
  }

//Load to S3 Bucket so it can be pushed to the database
const s3 = new AWS.S3({
    accessKeyId: 'awsaccesskey',
    secretAccessKey: 'awssecretkey'
});

const absoluteFilePath = "myfilepath&filename";

const uploadFile = () => {
  fs.readFile(absoluteFilePath, (err, data) => {
     if (err) throw err;
     const params = {
         Bucket: 'mybucketname', // pass your bucket name
         Key: 'mybucketname/folder/file', // file will be saved in <folderName> folder
         Body: data
     };
      s3.upload(params, function (s3Err, data) {
                    if (s3Err) throw s3Err
                    console.log(`File uploaded successfully at ${data.Location}`);
                    debugger;
                });
  });
};


main()