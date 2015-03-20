#!/usr/bin/env node

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

var spawn = require('child_process').spawn;
var path = require('path');

var CLI_MODULE_PATH = path.resolve(
  process.cwd(),
  'node_modules',
  'react-native',
  'cli'
);

var cli;
try {
  cli = require(CLI_MODULE_PATH);
} catch(e) {}

if (cli) {
  cli.run();
} else {
  var args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      'You did not pass any commands, did you mean to run init?'
    );
    process.exit(1);
  }

  if (args[0] === 'init') {
    init();
  } else {
    console.error(
      'Command `%s` unrecognized.' +
      'Did you mean to run this inside a react-native project?',
      args[0]
    );
    process.exit(1);
  }
}

function init() {
  console.log(
    'This will walk you through creating a new react-native project',
    'in the current directory'
  );

  console.log('Running npm init');
  run('npm init', function(e) {
    if (e) {
      console.error('npm init failed');
      process.exit(1);
    }

    run('npm install --save react-native', function(e) {
      if (e) {
        console.error('`npm install --save react-native` failed');
        process.exit(1);
      }

      var cli = require(CLI_MODULE_PATH);
      cli.init();
    });
  });
}

function run(command, cb) {
  var parts = command.split(/\s+/);
  var cmd = parts[0];
  var args = parts.slice(1);
  var proc = spawn(cmd, args, {stdio: 'inherit'});
  proc.on('close', function(code) {
    if (code !== 0) {
      cb(new Error('Command exited with a non-zero status'));
    } else {
      cb(null);
    }
  });
}
