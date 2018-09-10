/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  listTemplatesAndExit,
  createProjectFromTemplate,
} = require('../generator/templates');
const execSync = require('child_process').execSync;
const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const printRunInstructions = require('../generator/printRunInstructions');
const process = require('process');
const yarn = require('../util/yarn');

/**
 * Creates the template for a React Native project given the provided
 * parameters:
 * @param projectDir Templates will be copied here.
 * @param argsOrName Project name or full list of custom arguments
 *                   for the generator.
 * @param options Command line options passed from the react-native-cli directly.
 *                E.g. `{ version: '0.43.0', template: 'navigation' }`
 */
function init(projectDir, argsOrName) {
  const args = Array.isArray(argsOrName)
    ? argsOrName // argsOrName was e.g. ['AwesomeApp', '--verbose']
    : [argsOrName].concat(process.argv.slice(4)); // argsOrName was e.g. 'AwesomeApp'

  // args array is e.g. ['AwesomeApp', '--verbose', '--template', 'navigation']
  if (!args || args.length === 0) {
    console.error('react-native init requires a project name.');
    return;
  }

  const newProjectName = args[0];
  const options = minimist(args);

  if (listTemplatesAndExit(newProjectName, options)) {
    // Just listing templates using 'react-native init --template'
    // Not creating a new app.
    return;
  } else {
    console.log('Setting up new React Native app in ' + projectDir);
    generateProject(projectDir, newProjectName, options);
  }
}

/**
 * Generates a new React Native project based on the template.
 * @param Absolute path at which the project folder should be created.
 * @param options Command line arguments parsed by minimist.
 */
function generateProject(destinationRoot, newProjectName, options) {
  var reactNativePackageJson = require('../../package.json');
  var {peerDependencies} = reactNativePackageJson;
  if (!peerDependencies) {
    console.error(
      "Missing React peer dependency in React Native's package.json. Aborting.",
    );
    return;
  }

  var reactVersion = peerDependencies.react;
  if (!reactVersion) {
    console.error(
      "Missing React peer dependency in React Native's package.json. Aborting.",
    );
    return;
  }

  const yarnVersion =
    !options.npm &&
    yarn.getYarnVersionIfAvailable() &&
    yarn.isGlobalCliUsingYarn(destinationRoot);

  createProjectFromTemplate(
    destinationRoot,
    newProjectName,
    options.template,
    yarnVersion,
  );

  if (yarnVersion) {
    console.log('Adding React...');
    execSync(`yarn add react@${reactVersion}`, {stdio: 'inherit'});
  } else {
    console.log('Installing React...');
    execSync(`npm install react@${reactVersion} --save --save-exact`, {
      stdio: 'inherit',
    });
  }
  if (!options['skip-jest']) {
    const jestDeps = `jest babel-jest metro-react-native-babel-preset react-test-renderer@${reactVersion}`;
    if (yarnVersion) {
      console.log('Adding Jest...');
      execSync(`yarn add ${jestDeps} --dev --exact`, {stdio: 'inherit'});
    } else {
      console.log('Installing Jest...');
      execSync(`npm install ${jestDeps} --save-dev --save-exact`, {
        stdio: 'inherit',
      });
    }
    addJestToPackageJson(destinationRoot);
  }
  printRunInstructions(destinationRoot, newProjectName);
}

/**
 * Add Jest-related stuff to package.json, which was created by the react-native-cli.
 */
function addJestToPackageJson(destinationRoot) {
  var packageJSONPath = path.join(destinationRoot, 'package.json');
  var packageJSON = JSON.parse(fs.readFileSync(packageJSONPath));

  packageJSON.scripts.test = 'jest';
  packageJSON.jest = {
    preset: 'react-native',
  };
  fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2));
}

module.exports = init;
