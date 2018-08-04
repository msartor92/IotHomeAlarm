const sdk = require('aws-sdk');
const https = require('https');
const docClient = new sdk.DynamoDB.DocumentClient({region: 'eu-central-1'});
const db_params = {
    TableName: 'AlarmCheckStatus',
    Key:{
        "building": 'MyHome'
    }
};
const twentyMins = 1200000;
const optionspost = {
    host: 'maker.ifttt.com',
    path: '/trigger/system_ko/with/key/##iftthashkey##',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};
const postPayload = JSON.stringify({"value1" : "my sweet home"});
    
exports.handler = (event) => {
    docClient.get(db_params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            //console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            let lastPing = data.Item.lastPing.ts;
            let now = new Date().getTime();
            let expiration = now - twentyMins;
            
            let isAlive = lastPing >= expiration; 
            
            if(isAlive){
                console.log("OK");
            } else {
                console.log("now: ", now, "exp: ",expiration, "lsP: ", lastPing);
                console.log("KO");
                let body = '';
                
                let reqPost = https.request(optionspost, function(res) {
                    console.log("IFTTT statusCode: ", res.statusCode);
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    console.log(body);
                });
            
                reqPost.write(postPayload);
                reqPost.end();
                
                return null;
            }
        }
    });
};
