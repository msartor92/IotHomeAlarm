const Gpio = require('onoff').Gpio;
const fs = require('fs');
const request = require('request');
const AWS = require("aws-sdk");


var urls = [];
const keepAliveIntervall = 900000;// 60s * 15m
const debounce = 10000;// 10s

// ---- db conf -----

AWS.config.update({
  region: "eu-central-1",
  accessKeyId: "getYourOwn",
  secretAccessKey: "getYourOwn"
});

var docClient = new AWS.DynamoDB.DocumentClient()
const table = "AlarmCheckStatus";
const building = "MyHome";

// ---- update db keep alive -----
function keepAlive() {
  const ts = new Date().getTime();
  const query = {
    TableName: table,
    Key:{
      "building": building
    },
    UpdateExpression: "set lastPing = :p",
    ExpressionAttributeValues:{
      ":p": {
        "ts":ts
      }
    },
    ReturnValues:"UPDATED_NEW"
  };

  docClient.update(query, function(err, data) {
    if (err) {
      console.error("KeepAlive - Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      //console.log("KeepAlive succeeded:", new Date(data.Item.lastPing.ts));
    }
  });
}

// ---- reading url ----
function loadAddresses() {
  const raw_adress = fs.readFileSync('addresses.json', 'utf-8');
  const indirizzi = JSON.parse(raw_adress);

  if(indirizzi.length == 0) {
    console.log("No url loaded :-(");
  } else {
    console.log("Loaded: ", indirizzi);
  }

  return indirizzi;
}

// ----- GPIO setup -----
function alarm_evt(err, value) {
    /*
     * Interrupts aren't supported by the underlying hardware, so events
     * may be missed during the 1ms poll window.  The best we can do is to
     * print the current state after a event is detected.
     */
    if(err)
      throw err;

    console.log('Button event at %s on %s', new Date(), value);

    for(index in urls) {
    let req = urls[index];
      request(req.url)
      .on('error', function (error) {
        console.log("Error on requesting: %s", req.name);
        console.log(error);
      })
      .on('response', function(response) {
      console.log('%s on %s', response.statusCode, req.name);
    });
    }

    console.log("Request on all url done");
}


// ----- main ------
urls = loadAddresses();

setInterval(keepAlive, keepAliveIntervall);

let button = new Gpio(4, 'in', 'falling', {debounceTimeout: debounce});

button.watch(alarm_evt);

process.on('SIGINT', function () {
  button.unexport();
});

console.log("Alarm script ready at %s", new Date());

