#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander');
var speedtest = require('./speed').speedTest;


program
  .version('1.0.0')
  .description('Runs a speedtest using speed.aussiebroadband.com.au')
  .option('-j, --json [optional]', 'return json')
  .action(function(req,optional){

    if(program.json){
      console.log('json requested');
      speedtest(true);
    }
    else{
      speedtest();
    }
  })
  
program.parse(process.argv);