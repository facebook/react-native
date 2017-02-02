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

function createProjectFromTemplate(destPath, newProjectName, templateName) {
  copyProjectTemplateAndReplace(
    path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld'),
    destPath,
    newProjectName
  );
  if (templateName !== undefined) {
    // Keep the files from the HelloWorld template, and overwrite some of them
    // with the project template. The project template only contains JS code,
    // all the native files are kept from HelloWorld. This way we don't have
    // to duplicate the native files in every template (if we duplicated them
    // we'd make RN larger and risk that people would forget to maintain all
    // the copies so they would go out of sync).
    switch (templateName) {
      case 'navigation':
        copyProjectTemplateAndReplace(
          path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloNavigation'),
          destPath,
          newProjectName
        );
        break;
      default:
        throw new Error('Uknown template: ' + templateName);
    }
  }
}

module.exports = createProjectFromTemplate;
