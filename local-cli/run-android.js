/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var chalk = require('chalk');
var child_process = require('child_process');
var fs = require('fs');
var http = require('http');
var runPackager = require('./run-packager.js');

function checkAndroid() {
  return fs.existsSync('android/gradlew');
}

function buildAndRun() {
  process.chdir('android');
  try {
    var cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';
    var gradleArgs = ['installDebug'].concat(process.argv.slice(3));
    console.log(chalk.bold('Building and installing the app on the device (cd android && ' + cmd + ' ' + gradleArgs.join(' ') + ')...'));
    child_process.execFileSync(cmd, gradleArgs, {
      stdio: [process.stdin, process.stdout, process.stderr]
    });
  } catch (e) {
    console.log(chalk.red('Could not install the app on the device, see the error above.'));
    // stderr is automatically piped from the gradle process, so the user should see the error
    // already, there is no need to do console.log(e.stderr)
    return;
  }
  try {
    var packageName = fs.readFileSync('app/src/main/AndroidManifest.xml', 'utf8').match(/package="(.+?)"/)[1];
    var adbArgs = ['shell', 'am', 'start', '-n', packageName + '/.MainActivity'];
    console.log(chalk.bold('Starting the app (adb ' + adbArgs.join(' ') + ')...'));
    child_process.spawnSync('adb', adbArgs, {
      stdio: [process.stdin, process.stdout, process.stderr]
    });
  } catch (e) {
    console.log(chalk.red('adb invocation failed. Do you have adb in your PATH?'));
    // stderr is automatically piped from the adb process, so the user should see the error already,
    // there is no need to do console.log(e.stderr)
    return;
  }
}

module.exports = function() {
  if (!checkAndroid()) {
    console.log(chalk.red('Android project not found. Maybe run react-native android first?'));
    return;
  }
  // is packager running?
  var statusReq = http.get('http://localhost:8081/status', function(res) {
    var response = '';
    res.on('data', function(chunk) {
      response += chunk;
    });
    res.on('end', function() {
      if (response === 'packager-status:running') {
        console.log(chalk.bold('JS server already running.'));
      } else {
        console.log(chalk.yellow('[warn] JS server not recognized, continuing with build...'));
      }
      buildAndRun();
    });
  });
  statusReq.on('error', function() {
    // start packager first so it warms up
    console.log(chalk.bold('Starting JS server...'));
    runPackager(true);
    buildAndRun();
  });
};