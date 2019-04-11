#!/usr/bin/env node
'use strict';
const program = require('commander');

var store = require('store');
var puppeteer = require('puppeteer-core');
var request = require('request');
const chromeLauncher = require('chrome-launcher');
const util = require('util');

async function getSpeed() {
    

    const chrome  = await launch(puppeteer);
    const resp = await util.promisify(request)(`http://localhost:${chrome.port}/json/version`)
    const { webSocketDebuggerUrl } = JSON.parse(resp.body)
    const browser = await puppeteer.connect({
      browserWSEndpoint: webSocketDebuggerUrl
    })
  
    store.set('processPID', chrome.pid) 
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.goto('http://speed.aussiebroadband.com.au/', {timeout: 80000})
    await page.waitFor(5000)
    var frames = await page.frames()
    var speedFrame = frames.find(f =>f.url().indexOf("speedtestcustom") > 0)
    await speedFrame.$("#main-content > div.button__wrapper > div > button")
    await speedFrame.click('#main-content > div.button__wrapper > div > button')
    await speedFrame.waitForSelector('.gauge-assembly',{visible:true,timeout:0})
    console.log('Running speedtest...')
    await speedFrame.waitForSelector('.results-container-stage-finished',{visible:true,timeout:0})
    console.log('Speedtest complete...')
    await page.waitForSelector('#results',{visible:true,timeout:0})
  
    await page.waitFor(500)
    //stuff for screenshot
    const month =  new Date().getMonth()+1;         
    const year = new Date().getFullYear();
    const date = month+"_"+year;
    const time =  new Date().getTime();
    // const filename = encodeURI('speedtest_'+date+'_'+time+'.png');
    // console.log(filename);
    // const base64 = await page.screenshot({path:'./'+filename, encoding:'base64', clip: { x:620, y:208, width: 677.3, height: 481.8   }})
  
    const result = await speedFrame.evaluate(() => {
        
      let loctemp = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--sponsor > div.host-display__connection-body > h4 > span').innerText;
      let split = loctemp.split(',')
      let location = split[0];
      let ping = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span').innerText;
      let jitter = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span').innerText;
      let download = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-download > div.result-body > div > div > span').innerText;
      let upload = document.querySelector('#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-upload > div.result-body > div > div > span').innerText;
          
      let res = {
        location,ping,jitter,download,upload
      }
      
      return res
    })
    
    store.remove('browserEndpoint')
    await browser.close();
    //await chrome.kill()
    // return {result, 'filename':base64}
    return {result};
  }
  
async function runSpeed(option){
console.log('Booting speedtest');
let result = await getSpeed();
return new Promise((resolve, reject) => {
    if(result){
        if(option == true){
            console.log('results:',result.result);
        }else{
            console.log('-----------Results-----------');
            console.log('Server %s',result.result.location);
            console.log('Ping %s ms',result.result.ping);
            console.log('Jitter %s ms',result.result.jitter);
            console.log('Download %s Mbps',result.result.download);
            console.log('Upload %s Mbps',result.result.upload);
            console.log('-----------------------------');
        }

    }else{
        console.log('Speedtest failed');
    }
})
}


// Launch Puppeteer
async function launch (puppeteer) {
    let flag = [
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
    ]
    return chromeLauncher.launch({
      chromeFlags: flag,
      executablePath: getChromiumExecPath()
    })
}


  function getChromiumExecPath() {
    return puppeteer.executablePath();
  }



  module.exports.speedTest = runSpeed;