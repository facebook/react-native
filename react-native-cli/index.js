#!/usr/bin/env node

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// react-native-cli is installed globally on people's computers. This means
// that it is extremely difficult to have them upgrade the version and
// because there's only one global version installed, it is very prone to
// breaking changes.
//
// The only job of react-native-cli is to init the repository and then
// forward all the commands to the local version of react-native.
//
// If you need to add a new command, please add it to local-cli/.
//
// The only reason to modify this file is to add more warnings and
// troubleshooting information for the `react-native init` command.
//
// Do not make breaking changes! We absolutely don't want to have to
// tell people to update their global version of react-native-cli.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

'use strict';

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var prompt = require('prompt');
var semver = require('semver');
/**
 * Used arguments:
 *   -v --version - to print current version of react-native-cli and react-native dependency
 *   if you are in a RN app folder
 * init - to create a new project and npm install it
 *   --verbose - to print logs while init
 *   --version <alternative react-native package> - override default (https://registry.npmjs.org/react-native@latest),
 *      package to install, examples:
 *     - "0.22.0-rc1" - A new app will be created using a specific version of React Native from npm repo
 *     - "https://registry.npmjs.org/react-native/-/react-native-0.20.0.tgz" - a .tgz archive from any npm repo
 *     - "/Users/home/react-native/react-native-0.22.0.tgz" - for package prepared with `npm pack`, useful for e2e tests
 */
var argv = require('minimist')(process.argv.slice(2));

var CLI_MODULE_PATH = function() {
  return path.resolve(
    process.cwd(),
    'node_modules',
    'react-native',
    'cli.js'
  );
};

var REACT_NATIVE_PACKAGE_JSON_PATH = function() {
  return path.resolve(
    process.cwd(),
    'node_modules',
    'react-native',
    'package.json'
  );
};

checkForVersionArgument();

var cli;
var cliPath = CLI_MODULE_PATH();
if (fs.existsSync(cliPath)) {
  cli = require(cliPath);
}

// minimist api
var commands = argv._;
if (cli) {
  cli.run();
} else {
  if (commands.length === 0) {
    console.error(
      'You did not pass any commands, did you mean to run `react-native init`?'
    );
    process.exit(1);
  }

  switch (commands[0]) {
  case 'init':
    if (!commands[1]) {
      console.error(
        'Usage: react-native init <ProjectName> [--verbose]'
      );
      process.exit(1);
    } else {
      if (!argv.verbose) console.log('This may take some time...');
      init(commands[1], argv.verbose, argv.version);
    }
    break;
  default:
    console.error(
      'Command `%s` unrecognized. ' +
      'Make sure that you have run `npm install` and that you are inside a react-native project.',
      commands[0]
    );
    process.exit(1);
    break;
  }
}

function validatePackageName(name) {
  if (!name.match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
    console.error(
      '"%s" is not a valid name for a project. Please use a valid identifier ' +
        'name (alphanumeric).',
      name
    );
    process.exit(1);
  }

  if (name === 'React') {
    console.error(
      '"%s" is not a valid name for a project. Please do not use the ' +
        'reserved word "React".',
      name
    );
    process.exit(1);
  }
}

function init(name, verbose, rnPackage) {
  validatePackageName(name);

  if (fs.existsSync(name)) {
    createAfterConfirmation(name, verbose, rnPackage);
  } else {
    createProject(name, verbose, rnPackage);
  }
}

function createAfterConfirmation(name, verbose, rnPackage) {
  prompt.start();

  var property = {
    name: 'yesno',
    message: 'Directory ' + name + ' already exists. Continue?',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no'
  };

  prompt.get(property, function (err, result) {
    if (result.yesno[0] === 'y') {
      createProject(name, verbose, rnPackage);
    } else {
      console.log('Project initialization canceled');
      process.exit();
    }
  });
}

function createProject(name, verbose, rnPackage) {
  var root = path.resolve(name);
  var projectName = path.basename(root);

  console.log(
    'This will walk you through creating a new React Native project in',
    root
  );

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  var packageJson = {
    name: projectName,
    version: '0.0.1',
    private: true,
    scripts: {
      start: 'node node_modules/react-native/local-cli/cli.js start'
    }
  };
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson));
  process.chdir(root);

  console.log('Installing react-native package from npm...');

  if (verbose) {
    runVerbose(root, projectName, rnPackage);
  } else {
    run(root, projectName, rnPackage);
  }
}

function getInstallPackage(rnPackage) {
  var packageToInstall = 'react-native';
  var valideSemver = semver.valid(rnPackage);
  if (valideSemver) {
    packageToInstall += '@' + valideSemver;
  } else if (rnPackage) {
    // for tar.gz or alternative paths
    packageToInstall = rnPackage;
  }
  return packageToInstall;
}

function run(root, projectName, rnPackage) {
  exec('npm install --save --save-exact ' + getInstallPackage(rnPackage), function(e, stdout, stderr) {
    if (e) {
      console.log(stdout);
      console.error(stderr);
      console.error('`npm install --save --save-exact react-native` failed');
      process.exit(1);
    }

    checkNodeVersion();

    cli = require(CLI_MODULE_PATH());
    cli.init(root, projectName);
  });
}

function runVerbose(root, projectName, rnPackage) {
  var proc = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['install', '--verbose', '--save', '--save-exact', getInstallPackage(rnPackage)], {stdio: 'inherit'});
  proc.on('close', function (code) {
    if (code !== 0) {
      console.error('`npm install --save --save-exact react-native` failed');
      return;
    }

    cli = require(CLI_MODULE_PATH());
    cli.init(root, projectName);
  });
}

function checkNodeVersion() {
  var packageJson = require(REACT_NATIVE_PACKAGE_JSON_PATH());
  if (!packageJson.engines || !packageJson.engines.node) {
    return;
  }
  if (!semver.satisfies(process.version, packageJson.engines.node)) {
    console.error(chalk.red(
        'You are currently running Node %s but React Native requires %s. ' +
        'Please use a supported version of Node.\n' +
        'See https://facebook.github.io/react-native/docs/getting-started.html'
      ),
      process.version,
      packageJson.engines.node);
  }
}

function checkForVersionArgument() {
  if (argv._.length === 0 && (argv.v || argv.version)) {
    console.log('react-native-cli: ' + require('./package.json').version);
    try {
      console.log('react-native: ' + require(REACT_NATIVE_PACKAGE_JSON_PATH()).version);
    } catch (e) {
      console.log('react-native: n/a - not inside a React Native project directory');
    }
    process.exit();
  }
}
