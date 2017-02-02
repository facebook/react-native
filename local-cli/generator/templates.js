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
const path = require('path');

const availableTemplates = {
  navigation: 'HelloNavigation',
};

function listTemplatesAndExit(newProjectName, options) {
  if (options.template === true) {
    // Just listing templates using 'react-native init --template'.
    // Not creating a new app.
    // Print available templates and exit.
    const templateNames = Object.keys(availableTemplates);
    if (templateNames.length === 0) {
      // Just a guard, should never happen as long availableTemplates
      // above is defined correctly :)
      console.log(
        'There are no templates available besides ' +
        'the default "Hello World" one.'
      );
    } else {
      console.log(
        'The available templates are:\n' +
        templateNames.join('\n') +
        '\nYou can use these to create an app based on a template, for example: ' +
        'you could run: ' +
        'react-native init ' + newProjectName + ' --template ' + templateNames[0]
      );
    }
    // Exit 'react-native init'
    return true;
  }
  // Continue 'react-native init'
  return false;
}

function createProjectFromTemplate(destPath, newProjectName, templateName) {
  // Expand the basic 'HelloWorld' template
  copyProjectTemplateAndReplace(
    path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld'),
    destPath,
    newProjectName
  );

  if (templateName !== undefined) {
    // Keep the files from the 'HelloWorld' template, and overwrite some of them
    // with the specified project template.
    // The 'HelloWorld' template contains the native files (these are used by
    // all templates) and every other template only contains additional JS code.
    // Reason:
    // This way we don't have to duplicate the native files in every template.
    // If we duplicated them we'd make RN larger and risk that people would
    // forget to maintain all the copies so they would go out of sync.
    if (availableTemplates[templateName]) {
      copyProjectTemplateAndReplace(
        path.resolve(
          'node_modules', 'react-native', 'local-cli', 'templates', availableTemplates[templateName]
        ),
        destPath,
        newProjectName
      );
    } else {
      throw new Error('Uknown template: ' + templateName);
    }
  }
}

module.exports = {
  listTemplatesAndExit,
  createProjectFromTemplate,
};
