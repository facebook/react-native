#!/usr/bin/env node
'use strict';

var path = require('path');
var fs = require('fs');
var file = require('file');

if (process.argv.length === 0) {
  console.log('Usage: ' + path.basename(__filename) + ' <ProjectNameInCamelCase>');
  console.log('');
  console.log('This script will bootstrap new React Native app in current folder');
  process.exit(1);
}

var appName = process.argv[2];
var dest = process.cwd();
console.log('Setting up new React Native app in ' + dest);
console.log('');

main(dest, appName);

function cp(src, dest, appName) {
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
  }
  else {
    var content = fs.readFileSync(src, 'utf8')
      .replace(new RegExp('SampleApp', 'g'), appName)
      .replace(new RegExp('Examples/' + appName + '/', 'g'), '')
      .replace(new RegExp('../../Libraries/', 'g'), 'node_modules/react-native/Libraries/')
      .replace(new RegExp('../../React/', 'g'), 'node_modules/react-native/React/');
    fs.writeFileSync(dest, content);
  }
}

function main(dest, appName) {
  var source = path.resolve(__dirname, 'Examples/SampleApp');
  file.walk(source, function(error, _, dirs, files) {
    if (error) { throw error; }

    dirs.concat(files).forEach(function(f) {
      f = f.replace(source + '/', ''); // Strip off absolute path
      if (f === 'project.xcworkspace' || f === 'xcuserdata') { return; }
      var newFile = f.replace(new RegExp('SampleApp', 'g'), appName);
      cp(path.resolve(source, f), path.resolve(dest, newFile), appName);
    });
  });
}
