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
var exec = require('child_process').exec;

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

function launchEditor(fileName, lineNumber) {
  if (!fs.existsSync(fileName)) {
    return;
  }

  var argument = fileName;
  if (lineNumber) {
    argument += ':' + lineNumber;
  }

  var editor = process.env.REACT_EDITOR || process.env.EDITOR;
  if (editor) {
    console.log('Opening ' + chalk.underline(fileName) + ' with ' + chalk.bold(editor));
    exec(editor + ' ' + argument, function(error) {
      if (error) {
        console.log(chalk.red(error.message));
        printInstructions('How to fix');
      }
    });
  } else {
    printInstructions('PRO TIP');
  }
}

module.exports = launchEditor;
