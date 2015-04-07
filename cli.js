/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var program = require('commander');
var spec = require('./package.json');

function run() {
  program.version(spec.version);

  program
    .command('start')
    .description('starts the webserver')
    .action(startServer);

  program.on('*', function(command) {
    console.error('Command `%s` unrecognized', command);
    program.outputHelp();
    process.exit(1);
  });

  program.parse(process.argv);

  if (!program.args.length) {
    program.outputHelp();
    process.exit(1);
  }
}

function startServer() {
  spawn('sh', [
    path.resolve(__dirname, 'packager', 'packager.sh'),
    '--projectRoots',
    process.cwd(),
  ], {stdio: 'inherit'});
}

function init(root, projectName) {
  spawn(path.resolve(__dirname, 'init.sh'), [projectName], {stdio:'inherit'});
}

module.exports = {
  run: run,
  init: init,
};
