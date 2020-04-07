#!/usr/bin/env node
// @ts-check

const http = require('http');
const fs = require('fs');
const path = require('path');

function queryForServerStatus() {

  http.get('http://localhost:4873', res => {
    console.log(`Server status: ${res.statusCode}`);
    if (res.statusCode != 200) {
      setTimeout(queryForServerStatus, 2000);
    }
  }).on('error', err => {
    console.log(err.message);
    try {
      const logFile = fs.readFileSync(path.resolve(__dirname, 'verdaccio/console.log')).toString('utf8');
      console.log('verdaccio console output: ' + logFile);
    } catch (error) {
      console.log('no verdaccio console output yet.');
    }
    setTimeout(queryForServerStatus, 2000);
  });
}

console.log('Waiting for verdaccio instance to respond...');

queryForServerStatus();