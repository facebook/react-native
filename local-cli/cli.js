/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var install = require('./install.js');

function printUsage() {
  console.log([
    'Usage: react-native <command>',
    '',
    'Commands:',
    '  start: starts the webserver',
    '  install: installs npm react components'
  ].join('\n'));
  process.exit(1);
}

function run() {
  var args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
  }

  switch (args[0]) {
  case 'start':
    spawn('sh', [
      path.resolve(__dirname, '../packager', 'packager.sh'),
      '--projectRoots',
      process.cwd(),
    ], {stdio: 'inherit'});
    break;
  case 'install':
    install.init();
    break;
  default:
    console.error('Command `%s` unrecognized', args[0]);
    printUsage();
  }
  // Here goes any cli commands we need to
}

function init(root, projectName) {
  spawn(path.resolve(__dirname, '../init.sh'), [projectName], {stdio:'inherit'});
}

if (require.main === module) {
  run();
}

module.exports = {
  run: run,
  init: init,
};
