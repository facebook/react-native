/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var bundle = require('../private-cli/src/bundle/bundle');
var Config = require('../private-cli/src/util/Config');
var fs = require('fs');
var generate = require('../private-cli/src/generate/generate');
var init = require('./init.js');
var library = require('../private-cli/src/library/library');
var runAndroid = require('./run-android.js');
var server = require('../private-cli/src/server/server');

// TODO: remove once we fully roll out the `private-cli` based cli
// var bundle_DEPRECATED = require('./bundle.js');
// var generateAndroid_DEPRECATED = require('./generate-android.js');
// var newLibrary_DEPRECATED = require('./new-library.js');
// var runPackager_DEPRECATED = require('./run-packager.js');

function printUsage() {
  console.log([
    'Usage: react-native <command>',
    '',
    'Commands:',
    '  start: starts the webserver',
    '  bundle: builds the javascript bundle for offline use',
    '  new-library: generates a native library bridge',
    '  android: generates an Android project for your app'
  ].join('\n'));
  process.exit(1);
}

function printInitWarning() {
  console.log([
    'Looks like React Native project already exists in the current',
    'folder. Run this command from a different folder or remove node_modules/react-native'
  ].join('\n'));
  process.exit(1);
}

function run() {
  var args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
  }

  var config = Config.get(__dirname);
  switch (args[0]) {
  case 'start':
    server(args, config).done();
    // runPackager_DEPRECATED();
    break;
  case 'bundle':
    bundle(args, config).done();
    // bundle_DEPRECATED.init(args);
    break;
  case 'new-library':
    library(args, config).done();
    // newLibrary_DEPRECATED.init(args);
    break;
  case 'init':
    printInitWarning();
    break;
  case 'android':
    generate(
      [
        '--platform', 'android',
        '--project-path', process.cwd(),
        '--project-name', JSON.parse(
          fs.readFileSync('package.json', 'utf8')
        ).name
      ],
      config
    ).done();
    // generateAndroid(
    //   process.cwd(),
    //   JSON.parse(fs.readFileSync('package.json', 'utf8')).name
    // );
    break;
  case 'run-android':
    runAndroid();
    break;
  default:
    console.error('Command `%s` unrecognized', args[0]);
    printUsage();
  }
  // Here goes any cli commands we need to
}

if (require.main === module) {
  run();
}

module.exports = {
  run: run,
  init: init,
};
