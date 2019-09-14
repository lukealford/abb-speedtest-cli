#!/usr/bin/env node
'use strict';
const program = require('commander');
const store = require('store');
const puppeteer = require('puppeteer-core');
const request = require('request');
const jsonexport = require('jsonexport');
const chromeLauncher = require('chrome-launcher');
const util = require('util');
const { PendingXHR } = require('pending-xhr-puppeteer');
const fs = require('fs');

const locationIds = {
  'melbourne': 14670,
  'sydney': 15132,
  'adelaide': 15135,
  'brisbane': 15134,
  'perth': 15136
}

async function getSpeed(option) {

    const chrome = await launch(puppeteer);
    const resp = await util.promisify(request)(`http://localhost:${chrome.port}/json/version`)
    const { webSocketDebuggerUrl } = JSON.parse(resp.body)
    const browser = await puppeteer.connect({
      browserWSEndpoint: webSocketDebuggerUrl
    })

    store.set('processPID', chrome.pid) 
    const page = await browser.newPage()
    const pendingXHR = new PendingXHR(page);
    await page.setViewport({ width: 1920, height: 1080 })
    await page.goto('http://speed.aussiebroadband.com.au/', {timeout: 80000})
    await page.waitFor(5000)
    var frames = await page.frames()
    var speedFrame = frames.find(f =>f.url().indexOf("speedtestcustom") > 0)

    if (option.quiet != undefined) {
      console.log('Quiet mode. Result will not be reported to ABB.');
      await page.evaluate("$.post=function(){}");
    }

    if (option.location != undefined) {
      let locName = option.location.toLowerCase();
      console.log('Custom server location id:', locationIds[locName]);
      await speedFrame.click("#main-content > .host-select > .host-list-single");
      await speedFrame.click('.modal-gateway .host-listview__list .host-listview__list-item__button[data-id="' + locationIds[locName] + '"]');
    }
    
    await speedFrame.$("#main-content > div.button__wrapper > div > button")
    await speedFrame.click('#main-content > div.button__wrapper > div > button')
    await speedFrame.waitForSelector('.gauge-assembly',{visible:true,timeout:0})

    console.log('Running speedtest...')
    await speedFrame.waitForSelector('.results-container-stage-finished',{visible:true,timeout:0})
    console.log('Speedtest complete, parsing results...')
    await page.waitForSelector('#results',{visible:true,timeout:0})
    await page.waitFor(500);
    await pendingXHR.waitForAllXhrFinished();

    const result = await speedFrame.evaluate(() => {
      function timenow(){
          var now= new Date(), 
          ampm= 'am', 
          h= now.getHours(), 
          m= now.getMinutes(), 
          s= now.getSeconds();
          if(h>= 12){
              if(h>12) h -= 12;
              ampm= 'pm';
          }
          if(m<10) m= '0'+m;
          if(s<10) s= '0'+s;
          return now.toLocaleDateString()+ ' ' + h + ':' + m + ':' + s + ' ' + ampm;
      }
      let loctemp = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--sponsor > div.host-display__connection-body > h4 > span').innerText;
      let split = loctemp.split(',')
      let location = split[0];
      let ping = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span').innerText;
      let jitter = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span').innerText;
      let download = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-download > div.result-body > div > div > span').innerText;
      let upload = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-upload > div.result-body > div > div > span').innerText;
      let date = timenow();    
      let res = {
        location,ping,jitter,download,upload,date
      }
      return res
    })
    
    store.remove('browserEndpoint')
    await browser.close();
    //await chrome.kill()
    // return {result, 'filename':base64}
    return {result};
  }
  
async function runSpeedTest(option){
  console.log('Booting speedtest');

  let result = await getSpeed(option);

  return new Promise(async (resolve, reject)  => {
      if(result){
          if(option.json === true){
              if(option.save === true){
                try {
                  await checkDirectorySync(option.saveDir);
                  await saveFile(option.saveDir,result.result,'json');
                } catch (err) {
                  console.error(err)
                }
              }else{
                console.log('results:',result.result);
              }
          }
          else if(option.csv == true || option.dcsv != undefined){
            if(option.save === true){
              try {
                checkDirectorySync(option.saveDir);
                await saveFile(option.saveDir,result.result,'csv');
              } catch (err) {
                console.error(err)
              }
            }
            else{
              let rawResult = result.result;
              let isDcsv = option.dcsv != undefined;
              let csvConfig = {
                verticalOutput: !isDcsv,
                includeHeaders: !isDcsv // doesn't seem to work
              };

              let normalizedResult = isDcsv
                ? {
                  serverId: locationIds[rawResult.location.toLowerCase()],
                  sponsor: "Aussie Broadband",
                  serverName: rawResult.location,
                  timestamp: (new Date()).toISOString(),
                  distance: "",
                  ping: rawResult.ping,
                  download: parseFloat(rawResult.download) * 1024 * 1024,
                  upload: parseFloat(rawResult.upload) * 1024 * 1024,
                  share: "",
                  ip: ""
                }
                : rawResult;

              jsonexport(normalizedResult, csvConfig, function (err, csv) {
                if(err) console.log(err);
                console.log(csv);
              });
            }
          }
          else{
            console.log('-----------Results-----------');
            console.log('Date: %s',result.result.date);
            console.log('Server: %s',result.result.location);
            console.log('Ping: %s ms',result.result.ping);
            console.log('Jitter: %s ms',result.result.jitter);
            console.log('Download: %s Mbps',result.result.download);
            console.log('Upload: %s Mbps',result.result.upload);
            console.log('-----------------------------');
          }
      }else{
          console.log('Speedtest failed');
      }
  })
}


// Launch Puppeteer
async function launch (puppeteer) {
    return chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--proxy-server="direct://"',
        '--proxy-bypass-list=*',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-features=site-per-process',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain'
    ],
      executablePath: getChromiumExecPath()
    })
}


  function getChromiumExecPath() {
    return puppeteer.executablePath();
  }


  function checkDirectorySync(directory) {
    try {
      fs.statSync(directory);
    } catch(e) {    
      try {
          fs.mkdirSync(directory);
      } catch(e) {
          return e;
      }
    }
  }

  async function saveFile(dirpath,result,type){
    let filename;
    let date = new Date().getTime();
    if(type === 'csv'){
      filename = dirpath+'\\result-'+date+".csv";
      jsonexport(result,function(err, csv){
        if(err) console.log(err);

        fs.writeFile(filename, csv, (err) => {
          if (err) throw err;
      
          console.log("The file was succesfully saved!", filename);
        }); 

      })
    }
    if(type === 'json'){
      filename = dirpath+'\\result-'+date+".json";
      fs.writeFile(filename, JSON.stringify(result), (err) => {
        if (err) throw err;
    
        console.log("The file was succesfully saved!", filename);
      }); 
    }
  }




  module.exports.runSpeedTest = runSpeedTest;