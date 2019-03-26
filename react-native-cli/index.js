#!/usr/bin/env node

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
// To allow for graceful failure on older node versions, this file should
// retain ES5 compatibility.
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
var execSync = require('child_process').execSync;
var chalk = require('chalk');
var prompt = require('prompt');
var semver = require('semver');
/**
 * Used arguments:
 *   -v --version - to print current version of react-native-cli and react-native dependency
 *   if you are in a RN app folder
 * init - to create a new project and npm install it
 *   --verbose - to print logs while init
 *   --template - name of the template to use, e.g. --template navigation
 *   --version <alternative react-native package> - override default (https://registry.npmjs.org/react-native@latest),
 *      package to install, examples:
 *     - "0.22.0-rc1" - A new app will be created using a specific version of React Native from npm repo
 *     - "https://registry.npmjs.org/react-native/-/react-native-0.20.0.tgz" - a .tgz archive from any npm repo
 *     - "/Users/home/react-native/react-native-0.22.0.tgz" - for package prepared with `npm pack`, useful for e2e tests
 */

var options = require('minimist')(process.argv.slice(2));

var CLI_MODULE_PATH = function() {
  return path.resolve(process.cwd(), 'node_modules', 'react-native', 'cli.js');
};

var REACT_NATIVE_PACKAGE_JSON_PATH = function() {
  return path.resolve(
    process.cwd(),
    'node_modules',
    'react-native',
    'package.json',
  );
};

if (options._.length === 0 && (options.v || options.version)) {
  printVersionsAndExit(REACT_NATIVE_PACKAGE_JSON_PATH());
}

// Use Yarn if available, it's much faster than the npm client.
// Return the version of yarn installed on the system, null if yarn is not available.
function getYarnVersionIfAvailable() {
  var yarnVersion;
  try {
    // execSync returns a Buffer -> convert to string
    if (process.platform.startsWith('win')) {
      yarnVersion = (execSync('yarn --version 2> NUL').toString() || '').trim();
    } else {
      yarnVersion = (
        execSync('yarn --version 2>/dev/null').toString() || ''
      ).trim();
    }
  } catch (error) {
    return null;
  }
  // yarn < 0.16 has a 'missing manifest' bug
  try {
    if (semver.gte(yarnVersion, '0.16.0')) {
      return yarnVersion;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Cannot parse yarn version: ' + yarnVersion);
    return null;
  }
}

var cli;
var cliPath = CLI_MODULE_PATH();
if (fs.existsSync(cliPath)) {
  cli = require(cliPath);
}

var commands = options._;
if (cli) {
  cli.run();
} else {
  if (options._.length === 0 && (options.h || options.help)) {
    console.log(
      [
        '',
        '  Usage: react-native [command] [options]',
        '',
        '',
        '  Commands:',
        '',
        '    init <ProjectName> [options]  generates a new project and installs its dependencies',
        '',
        '  Options:',
        '',
        '    -h, --help    output usage information',
        '    -v, --version use a specific version of React Native',
        '    --template use an app template. Use --template to see available templates.',
        '',
      ].join('\n'),
    );
    process.exit(0);
  }

  if (commands.length === 0) {
    console.error(
      'You did not pass any commands, run `react-native --help` to see a list of all available commands.',
    );
    process.exit(1);
  }

  switch (commands[0]) {
    case 'init':
      if (!commands[1]) {
        console.error('Usage: react-native init <ProjectName> [--verbose]');
        process.exit(1);
      } else {
        init(commands[1], options);
      }
      break;
    default:
      console.error(
        'Command `%s` unrecognized. ' +
          'Make sure that you have run `npm install` and that you are inside a react-native project.',
        commands[0],
      );
      process.exit(1);
      break;
  }
}

function validateProjectName(name) {
  if (!String(name).match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
    console.error(
      '"%s" is not a valid name for a project. Please use a valid identifier ' +
        'name (alphanumeric).',
      name,
    );
    process.exit(1);
  }

  if (name === 'React') {
    console.error(
      '"%s" is not a valid name for a project. Please do not use the ' +
        'reserved word "React".',
      name,
    );
    process.exit(1);
  }
}

/**
 * @param name Project name, e.g. 'AwesomeApp'.
 * @param options.verbose If true, will run 'npm install' in verbose mode (for debugging).
 * @param options.version Version of React Native to install, e.g. '0.38.0'.
 * @param options.npm If true, always use the npm command line client,
 *                       don't use yarn even if available.
 */
function init(name, options) {
  validateProjectName(name);

  if (fs.existsSync(name)) {
    createAfterConfirmation(name, options);
  } else {
    createProject(name, options);
  }
}

function createAfterConfirmation(name, options) {
  prompt.start();

  var property = {
    name: 'yesno',
    message: 'Directory ' + name + ' already exists. Continue?',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no',
  };

  prompt.get(property, function(err, result) {
    if (result.yesno[0] === 'y') {
      createProject(name, options);
    } else {
      console.log('Project initialization canceled');
      process.exit();
    }
  });
}

function createProject(name, options) {
  var root = path.resolve(name);
  var projectName = path.basename(root);

  console.log(
    'This will walk you through creating a new React Native project in',
    root,
  );

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  var packageJson = {
    name: projectName,
    version: '0.0.1',
    private: true,
    scripts: {
      start: 'node node_modules/react-native/local-cli/cli.js start',
      ios: 'react-native run-ios',
      android: 'react-native run-android',
    },
  };
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson),
  );
  process.chdir(root);

  run(root, projectName, options);
}

function getInstallPackage(rnPackage) {
  var packageToInstall = 'react-native';
  var isValidSemver = semver.valid(rnPackage);
  if (isValidSemver) {
    packageToInstall += '@' + isValidSemver;
  } else if (rnPackage) {
    // for tar.gz or alternative paths
    packageToInstall = rnPackage;
  }
  return packageToInstall;
}

function run(root, projectName, options) {
  var rnPackage = options.version; // e.g. '0.38' or '/path/to/archive.tgz'
  var forceNpmClient = options.npm;
  var yarnVersion = !forceNpmClient && getYarnVersionIfAvailable();
  var installCommand;
  if (options.installCommand) {
    // In CI environments it can be useful to provide a custom command,
    // to set up and use an offline mirror for installing dependencies, for example.
    installCommand = options.installCommand;
  } else {
    if (yarnVersion) {
      console.log('Using yarn v' + yarnVersion);
      console.log('Installing ' + getInstallPackage(rnPackage) + '...');
      installCommand = 'yarn add ' + getInstallPackage(rnPackage) + ' --exact';
      if (options.verbose) {
        installCommand += ' --verbose';
      }
    } else {
      console.log('Installing ' + getInstallPackage(rnPackage) + '...');
      if (!forceNpmClient) {
        console.log(
          'Consider installing yarn to make this faster: https://yarnpkg.com',
        );
      }
      installCommand =
        'npm install --save --save-exact ' + getInstallPackage(rnPackage);
      if (options.verbose) {
        installCommand += ' --verbose';
      }
    }
  }
  try {
    execSync(installCommand, {stdio: 'inherit'});
  } catch (err) {
    console.error(err);
    console.error('Command `' + installCommand + '` failed.');
    process.exit(1);
  }
  checkNodeVersion();
  cli = require(CLI_MODULE_PATH());
  cli.init(root, projectName);
}

function checkNodeVersion() {
  var packageJson = require(REACT_NATIVE_PACKAGE_JSON_PATH());
  if (!packageJson.engines || !packageJson.engines.node) {
    return;
  }
  if (!semver.satisfies(process.version, packageJson.engines.node)) {
    console.error(
      chalk.red(
        'You are currently running Node %s but React Native requires %s. ' +
          'Please use a supported version of Node.\n' +
          'See https://facebook.github.io/react-native/docs/getting-started.html',
      ),
      process.version,
      packageJson.engines.node,
    );
  }
}

function printVersionsAndExit(reactNativePackageJsonPath) {
  console.log('react-native-cli: ' + require('./package.json').version);
  try {
    console.log('react-native: ' + require(reactNativePackageJsonPath).version);
  } catch (e) {
    console.log(
      'react-native: n/a - not inside a React Native project directory',
    );
  }
  process.exit();
}
