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

const walk = require('walk');

/**
 * Util for creating a new React Native project.
 * Copy the project from a template and use the correct project name in
 * all files.
 * @param srcPath e.g. 'templates/HelloWorld'
 * @param destPath e.g. '/Users/me/apps'
 * @param newProjectName e.g. 'AwesomeApp'
 */
function copyProjectTemplateAndReplace(
	srcPath: string,
	destPath: string,
	newProjectName: string) {
  walk(source).forEach(fileName => {
    const newFileName = fileName.replace(/HelloWorld/g, newProjectName);
    copyAndReplace(
      path.resolve(sourcePath, fileName),
      path.resolve(destPath, newFileName),
      {'HelloWorld': newProjectName}
    );
  });
}

module.exports = copyProjectTemplateAndReplace;