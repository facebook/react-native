/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var fs = require('fs');
var spawn = require('child_process').spawn;

var firstLaunch = true;

function guessEditor() {
  if (firstLaunch) {
    console.log('When you see Red Box with stack trace, you can click any ' +
      'stack frame to jump to the source file. The packager will launch your ' +
      'editor of choice. It will first look at REACT_EDITOR environment ' +
      'variable, then at EDITOR. To set it up, you can add something like ' +
      'REACT_EDITOR=atom to your .bashrc.');
    firstLaunch = false;
  }

  var editor = process.env.REACT_EDITOR || process.env.EDITOR || 'subl';
  return editor;
}

function launchEditor(fileName, lineNumber) {
  if (!fs.existsSync(fileName)) {
    return;
  }

  var argument = fileName;
  if (lineNumber) {
    argument += ':' + lineNumber;
  }

  var editor = guessEditor();
  console.log('Opening ' + fileName + ' with ' + editor);
  spawn(editor, [argument], { stdio: ['pipe', 'pipe', process.stderr] });
}

module.exports = launchEditor;
