# IOT Home alarm system #

Following this example you could understand how to convert your old home wired alarm with pre-recorded phone notification to a new iot system.

The problem: I want to remove my home landline phone. So how to continue use my home wired alarm without reciving phone call when alarm is triggered?


What you need?

1. Some electrician skill, multimeter, screwdrivers
2. Internet connection
3. Your smartphone
4. Working Raspberry pi
5. [AWS](https://aws.amazon.com/) account
6. [IFTTT](https://ifttt.com/) account

### General description ###

**Step 1:** The idea is to connect the control unit of your home alarm platform to a GPIO of your Raspberry pi. In this way when you alarm is triggerd the GPIO collect signal that can be used to notify your mobile.

**Step 2:** Now how could you Raspberry notify your Android mobile? Through your IFTTT account you could configure an applet to revice HTTP request and send Notification to the app in your mobile. 

**Step 3:** This could looks very nice but last not least things is how to monitor that your Pi is alway working correctly? Using an AWS free plan you could tell your Pi to send an alive signal that will checked from a cronned lambda expression. In case of fail is detected a KO notification will send to you.

### Phase 1 - Identify a pin! ###
The first thing you need is open you alarm control unit and identify where you could connet your Pi. You need to identify a pin which is triggered when your alarm detect an intrusion. 

Made some test, starting from siren connector. Once you have identify a pin connect it to the Pi and proceed with the next steps.

Below you could see my own connection.



### Phase 2 - Configure [IFTTT](https://ifttt.com/) Applet ###
Configure IFTTT to send notification to your [Android](https://play.google.com/store/apps/details?id=com.ifttt.ifttt&hl=it)/[IOS](https://itunes.apple.com/it/app/ifttt/id660944635?mt=8) mobile phone.

You have to install the app in all smartphone you want to send notification. Once you have install create an IFTTT account for each user. 

After a succesfull login you need to configure two new [Applet](https://ifttt.com/my_applets) one for alarm notification and one for software KO notification which will be send if your Pi goes down.

To configure an applet click on new Applet button and choose Webhooks for the if section and Notifications for then section.
Follow applet steps and set the text of the notification you want to recice. And then pick up webhook URL that you need in Setup Pi phase.


### Phase 3 - Setup [AWS](https://aws.amazon.com/) [DynamoDB](https://aws.amazon.com/en/dynamodb/?hp=tile&so-exp=below) and [Lambda expression](https://aws.amazon.com/en/lambda/?nc2=h_m1) ###
To check the status of your new IOT alarm you need to configure two aws services.

*(Don't worry for the porpouse of this project you don't have to pay any fee. AWS Lambda and DynamoDB are free under a certain range of usage).*

*[Lambda fee](https://aws.amazon.com/en/lambda/pricing/)*

*[DynamoDB fee](https://aws.amazon.com/en/dynamodb/pricing/)*

**First step:** Enter in you AWS account and opend DynamoDB section. You need to create a simple table with just one field. You could perform this operation using AWS console.

I've created a simle table with just two field one to identify the building and one that contains a timestamp. We'll understand later who set this data.

Example:

```
{
  "building": "MyHome",
  "lastPing": {
    "ts": 1533381549565
  }
}
```

**Second step:** Always from your AWS console you need to configure a Lambda expression. The target of this function is to check each 20 mins if your Pi's push into DynamoDB an updated timestamp. In case of we found an old value we could assume that the Pi is down so we push a notification to our mobile app.

From Lambda console click on new function, select [Node.js](https://nodejs.org/), than click to create function. You could copy the code from my lambda.js file or if you prefer write your own version. After code submitting schedule your lambda to run each 20 min or the time you prefer.

*Keep in mind that if you run the lambda more frequently you could need a premium plan on AWS*

P.S. To made Lambda and Pi access DynamoDB you have to configure some account and role. You could find on Amazon documentation how to do it. Enojoy !!

### Phase 4 - Setup the PI ###
This phase problem is how to detect GPIO signal to sent it to the IFTTT back-end. 

For this porpouse I develop using a low leve [GPIO](https://en.wikipedia.org/wiki/General-purpose_input/output) library a [Node.js](https://nodejs.org/) script. The script is listening on the event coming from pin 17 and when it is fired it send an HTTP request to all the adresses listed in adressed.json file.

To monito your Pi find steps below on section 3. That script push the current timestamp into DynamoDB table you have configured in the previous phase.

How to make this works:

0. Install [NPM](https://www.npmjs.com/) and [Node.js](https://nodejs.org/)
1. Setup notification URL
    1. Open the adresses.json file
    2. Create an object inside the array for each user you want to notify
    3. Put in the url field the IFTTT webhook adress and in the name field the name of the person will be notified (log pourpose only)
    4. Save and exit
2. Setup main script
    1. Copy from this repository main.js file into your Pi home directory
    2. Setup a cron expression to run script at boot. This help you in case of Pi failure to restart automatically node.

    example: 
    ```@reboot sudo /home/osmc/.nvm/versions/node/v8.11.1/bin/node /home/osmc/js/main.js >> /home/osmc/log/alarm_js.log 2>&1```
3. Setup keepalive script
    1. Copy lambda.js script into you Pi home.
    2. Open the file with a text editor
    3. Configure in the initial lines the AWS region you choose for you table, the table name and the IFTTT emergency webhook URL.
    4. Save and exit
    5. Put also lambda.js script under cron expression

Pi setup is completed!! Let's test it!!


### Hardware ###

I've used a Pi 1 model B but you could choose a newer once. The only thing that change in this project is GPIO pin to use.
About Pi's OS I've choose [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) that is a simple basic distro but choose the one you like.

Usefull links:

[Pi](https://www.amazon.com/Raspberry-PI-Model-Scheda-madre/dp/B01CD5VC92/ref=sr_1_7?ie=UTF8&qid=1533383850&sr=8-7&keywords=raspberry)

[MicroSD](https://www.amazon.it/gp/product/B073K14CVB/ref=oh_aui_detailpage_o01_s00?ie=UTF8&psc=1)

[Connection wire](https://www.amazon.it/gp/product/B01N40EK6M/ref=oh_aui_detailpage_o06_s00?ie=UTF8&psc=1)

To made all system more save I've connect the Pi plug to alarm battery using a mobile phone car adapter this help you transforming 12V into 5V needed from Pi. In this way if your home remain without elettricity you alarm is still alive.

**Keep attention that USB charger is enought powerfull for your Pi. If you use a tablet charger you have no problem. Keep attention that yours has at least 2A.**
    
[USB Charger](https://www.amazon.com/AUKEY-Charger-Output-iPhone-Samsung/dp/B00M6QODH2/ref=sr_1_15?ie=UTF8&qid=1533384251&sr=8-15&keywords=mobile+car+charger)