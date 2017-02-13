/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const copyAndReplace = require('../util/copyAndReplace');
const path = require('path');
const prompt = require('./promptSync')();
const walk = require('../util/walk');

/**
 * Util for creating a new React Native project.
 * Copy the project from a template and use the correct project name in
 * all files.
 * @param srcPath e.g. '/Users/martin/AwesomeApp/node_modules/react-native/local-cli/templates/HelloWorld'
 * @param destPath e.g. '/Users/martin/AwesomeApp'
 * @param newProjectName e.g. 'AwesomeApp'
 */
function copyProjectTemplateAndReplace(srcPath, destPath, newProjectName, options) {
  if (!srcPath) { throw new Error('Need a path to copy from'); }
  if (!destPath) { throw new Error('Need a path to copy to'); }
  if (!newProjectName) { throw new Error('Need a project name'); }

  options = options || {};

  walk(srcPath).forEach(absoluteSrcFilePath => {

    // 'react-native upgrade'
    if (options.upgrade) {
      // Don't upgrade these files
      const fileName = path.basename(absoluteSrcFilePath);
      // This also includes __tests__/index.*.js
      if (fileName === 'index.ios.js') { return; }
      if (fileName === 'index.android.js') { return; }
    }

    const relativeFilePath = path.relative(srcPath, absoluteSrcFilePath);
    const relativeRenamedPath = dotFilePath(relativeFilePath)
      .replace(/HelloWorld/g, newProjectName)
      .replace(/helloworld/g, newProjectName.toLowerCase());

    let contentChangedCallback = null;
    if (options.upgrade && (!options.force)) {
      contentChangedCallback = (_, contentChanged) => {
        return upgradeFileContentChangedCallback(
          absoluteSrcFilePath,
          relativeRenamedPath,
          contentChanged,
        );
      };
    }
    copyAndReplace(
      absoluteSrcFilePath,
      path.resolve(destPath, relativeRenamedPath),
      {
        'Hello App Display Name': options.displayName || newProjectName,
        'HelloWorld': newProjectName,
        'helloworld': newProjectName.toLowerCase(),
      },
      contentChangedCallback,
    );
  });
}

/**
 * There are various dotfiles in the templates folder in the RN repo. We want
 * these to be ignored by tools when working with React Native itself.
 * Example: _babelrc file is ignored by Babel, renamed to .babelrc inside
 *          a real app folder.
 * This is especially important for .gitignore because npm has some special
 * behavior of automatically renaming .gitignore to .npmignore.
 */
function dotFilePath(path) {
  if (!path) return path;
  return path
    .replace('_gitignore', '.gitignore')
    .replace('_gitattributes', '.gitattributes')
    .replace('_babelrc', '.babelrc')
    .replace('_flowconfig', '.flowconfig')
    .replace('_buckconfig', '.buckconfig')
    .replace('_watchmanconfig', '.watchmanconfig');
}

function upgradeFileContentChangedCallback(
  absoluteSrcFilePath,
  relativeDestPath,
  contentChanged
) {
  if (contentChanged === 'new') {
    console.log(chalk.bold('new') + ' ' + relativeDestPath);
    return 'overwrite';
  } else if (contentChanged === 'changed') {
    console.log(chalk.bold(relativeDestPath) + ' ' +
      'has changed in the new version.\nDo you want to keep your ' +
      relativeDestPath + ' or replace it with the ' +
      'latest version?\nIf you ever made any changes ' +
      'to this file, you\'ll probably want to keep it.\n' +
      'You can see the new version here: ' + absoluteSrcFilePath + '\n' +
      'Do you want to replace ' + relativeDestPath + '? ' +
      'Answer y to replace, n to keep your version: ');
    const answer = prompt();
    if (answer === 'y') {
      console.log('Replacing ' + relativeDestPath);
      return 'overwrite';
    } else {
      console.log('Keeping your ' + relativeDestPath);
      return 'keep';
    }
  } else if (contentChanged === 'identical') {
    return 'keep';
  } else {
    throw new Error(`Unkown file changed state: ${relativeDestPath}, ${contentChanged}`);
  }
}

module.exports = copyProjectTemplateAndReplace;
