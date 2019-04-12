#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander');
var speedtest = require('./index').speedTest;
const homedir = require('os').homedir();
const fs = require('fs');

program
  .version('1.1.0')
  .description('Runs a speedtest using speed.aussiebroadband.com.au')
  .option('-j, --json [optional]', 'return json')
  .option('-c, --csv [optional]', 'return csv format')
  .option('-s, --save [optional]', 'saves format to user\\Documents\\abb-speedtests')
  .option('-o, --output [optional]', 'overwrites output location')
  .action(function(req,optional){
    let dir = '';
    if(program.save){
        dir = homedir+"\\Documents\\abb-speedtests";
        try {
          checkFolder(dir)
          console.log('Saving result defualt directory:', dir)
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

    let input = {
      json:program.json,
      csv:program.csv,
      save:program.save,
      output:program.output,
      saveDir: dir
    }
   
    speedtest(input);
  })  
  
program.parse(process.argv);


function checkFolder (dirpath) {
  try {
    fs.mkdirSync(dirpath, { recursive: true })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}
