/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const copyAndReplace = require('../util/copyAndReplace');
const path = require('path');
const walk = require('../util/walk');

/**
 * Util for creating a new React Native project.
 * Copy the project from a template and use the correct project name in
 * all files.
 * @param srcPath e.g. '/Users/martin/AwesomeApp/node_modules/react-native/local-cli/templates/HelloWorld'
 * @param destPath e.g. '/Users/martin/AwesomeApp'
 * @param newProjectName e.g. 'AwesomeApp'
 */
function copyProjectTemplateAndReplace(srcPath, destPath, newProjectName) {
  if (!srcPath) throw new Error('Need a path to copy from');
  if (!destPath) throw new Error('Need a path to copy to');
  if (!newProjectName) throw new Error('Need a project name');

  walk(srcPath).forEach(absoluteFilePath => {
    const relativeFilePath = path.relative(srcPath, absoluteFilePath);
    const relativeRenamedPath = relativeFilePath
      .replace(/HelloWorld/g, newProjectName)
      .replace(/helloworld/g, newProjectName.toLowerCase());
    copyAndReplace(
      absoluteFilePath,
      path.resolve(destPath, relativeRenamedPath),
      {
        'HelloWorld': newProjectName,
        'helloworld': newProjectName.toLowerCase(),
      }
    );
  });
}

module.exports = copyProjectTemplateAndReplace;
