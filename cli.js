#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander');
var runSpeedTest = require('./index').runSpeedTest;
const homedir = require('os').homedir();
const fs = require('fs');

program
  .version('1.2.0')
  .description('Runs a speedtest using speed.aussiebroadband.com.au')
  .option('-l, --location [Sydney] [optional]', 'use specific server location')
  .option('-q, --quiet [optional]', 'disables result reporting to ABB')
  .option('-j, --json [optional]', 'return json')
  .option('-c, --csv [optional]', 'return csv format')
  .option('-d, --dcsv [optional]', 'return csv format in speedtest-cli shape (non-save flow only)')
  .option('-s, --save [optional]', 'saves format to user\\Documents\\abb-speedtests')
  .option('-o, --output [optional]', 'overwrites output location')
  .action(function(req,optional){
    let dir = '';
    if(program.save){
        dir = homedir+"\\Documents\\abb-speedtests";
        try {
          checkFolder(dir)
          console.log('Saving result default directory:', dir)
        } catch (err) {
          console.error(err)
        } 
    }
    
    if(program.save == true && program.output){
        console.log(program.output)
        dir = program.output;
        try {
          checkFolder(dir)
          console.log('Saving result to input directory:', dir)
        } catch (err) {
          console.error(err)
        }
    }

    let option = {
      location: program.location,
      quiet: program.quiet,
      json:program.json,
      csv:program.csv,
      dcsv:program.dcsv,
      save:program.save,
      output:program.output,
      saveDir: dir
    }
   
    runSpeedTest(option);
  })  
  
program.parse(process.argv);


function checkFolder (dirpath) {
  try {
    fs.mkdirSync(dirpath, { recursive: true })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}
