/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const copyProjectTemplateAndReplace = require('./copyProjectTemplateAndReplace');
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const availableTemplates = {
  navigation: 'HelloNavigation',
};

function listTemplatesAndExit(newProjectName, options) {
  if (options.template === true) {
    // Just listing templates using 'react-native init --template'.
    // Not creating a new app.
    // Print available templates and exit.
    const templateKeys = Object.keys(availableTemplates);
    if (templateKeys.length === 0) {
      // Just a guard, should never happen as long availableTemplates
      // above is defined correctly :)
      console.log(
        'There are no templates available besides ' +
        'the default "Hello World" one.'
      );
    } else {
      console.log(
        'The available templates are:\n' +
        templateKeys.join('\n') +
        '\nYou can use these to create an app based on a template, for example: ' +
        'you could run: ' +
        'react-native init ' + newProjectName + ' --template ' + templateKeys[0]
      );
    }
    // Exit 'react-native init'
    return true;
  }
  // Continue 'react-native init'
  return false;
}

/**
 * @param newProjectName For example 'AwesomeApp'.
 * @param templateKey Template to use, for example 'navigation'.
 * @param yarnVersion Version of yarn available on the system, or null if
 *                    yarn is not available. For example '0.18.1'.
 */
function createProjectFromTemplate(destPath, newProjectName, templateKey, yarnVersion) {
  // Expand the basic 'HelloWorld' template
  copyProjectTemplateAndReplace(
    path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld'),
    destPath,
    newProjectName
  );

  if (templateKey !== undefined) {
    // Keep the files from the 'HelloWorld' template, and overwrite some of them
    // with the specified project template.
    // The 'HelloWorld' template contains the native files (these are used by
    // all templates) and every other template only contains additional JS code.
    // Reason:
    // This way we don't have to duplicate the native files in every template.
    // If we duplicated them we'd make RN larger and risk that people would
    // forget to maintain all the copies so they would go out of sync.
    const templateName = availableTemplates[templateKey];
    if (templateName) {
      copyProjectTemplateAndReplace(
        path.resolve(
          'node_modules', 'react-native', 'local-cli', 'templates', templateName
        ),
        destPath,
        newProjectName
      );
    } else {
      throw new Error('Uknown template: ' + templateKey);
    }

    // Add dependencies:

    // dependencies.json is a special file that lists additional dependencies
    // that are required by this template
    const dependenciesJsonPath = path.resolve(
      'node_modules', 'react-native', 'local-cli', 'templates', templateName, 'dependencies.json'
    );
    if (fs.existsSync(dependenciesJsonPath)) {
      console.log('Adding dependencies for the project...');
      const dependencies = JSON.parse(fs.readFileSync(dependenciesJsonPath));
      for (let depName in dependencies) {
        const depVersion = dependencies[depName];
        const depToInstall = depName + '@' + depVersion;
        console.log('Adding ' + depToInstall + '...');
        if (yarnVersion) {
          execSync(`yarn add ${depToInstall}`, {stdio: 'inherit'});
        } else {
          execSync(`npm install ${depToInstall} --save --save-exact`, {stdio: 'inherit'});
        }
      }
    }
  }
}

module.exports = {
  listTemplatesAndExit,
  createProjectFromTemplate,
};
