/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var chalk = require('chalk');
var fs = require('fs');
var spawn = require('child_process').spawn;

function isTerminalEditor(editor) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
  }
  return false;
}

function getArgumentsForLineNumber(editor, fileName, lineNumber) {
  switch (editor) {
    case 'vim':
    case 'mvim':
      return [fileName, '+' + lineNumber];
    case 'atom':
    case 'subl':
    case 'sublime':
      return [fileName + ':' + lineNumber];
    case 'joe':
    case 'emacs':
      return ['+' + lineNumber, fileName];
    case 'rmate':
    case 'mate':
      return ['--line', lineNumber, fileName];
  }

  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return [fileName];
}

function printInstructions(title) {
  console.log([
    '',
    chalk.bgBlue.white.bold(' ' + title + ' '),
    '  When you see Red Box with stack trace, you can click any ',
    '  stack frame to jump to the source file. The packager will launch your ',
    '  editor of choice. It will first look at REACT_EDITOR environment ',
    '  variable, then at EDITOR. To set it up, you can add something like ',
    '  REACT_EDITOR=atom to your .bashrc.',
    ''
  ].join('\n'));
}

var _childProcess = null;
function launchEditor(fileName, lineNumber) {
  if (!fs.existsSync(fileName)) {
    return;
  }

  var editor = process.env.REACT_EDITOR || process.env.EDITOR;
  if (!editor) {
    printInstructions('PRO TIP');
    return;
  }

  var args = [fileName];
  if (lineNumber) {
    args = getArgumentsForLineNumber(editor, fileName, lineNumber);
  }
  console.log('Opening ' + chalk.underline(fileName) + ' with ' + chalk.bold(editor));

  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL');
  }

  _childProcess = spawn(editor, args, {stdio: 'inherit'});
  _childProcess.on('exit', function(errorCode) {
    _childProcess = null;

    if (errorCode) {
      console.log(chalk.red('Your editor exited with an error!'));
      printInstructions('Keep these instructions in mind:');
    }
  });

  _childProcess.on('error', function(error) {
    console.log(chalk.red(error.message));
    printInstructions('How to fix:');
  })
}

module.exports = launchEditor;
