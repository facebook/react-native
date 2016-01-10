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
var path = require('path');
var child_process = require('child_process');

function isTerminalEditor(editor) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
  }
  return false;
}

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
var COMMON_EDITORS = {
  '/Applications/Atom.app/Contents/MacOS/Atom': 'atom',
  '/Applications/Sublime Text.app/Contents/MacOS/Sublime Text':
    '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text 2.app/Contents/MacOS/Sublime Text 2':
    '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
};

function getArgumentsForLineNumber(editor, fileName, lineNumber) {
  switch (path.basename(editor)) {
    case 'vim':
    case 'mvim':
      return [fileName, '+' + lineNumber];
    case 'atom':
    case 'subl':
    case 'sublime':
      return [fileName + ':' + lineNumber];
    case 'joe':
    case 'emacs':
    case 'emacsclient':
      return ['+' + lineNumber, fileName];
    case 'rmate':
    case 'mate':
    case 'mine':
      return ['--line', lineNumber, fileName];
  }

  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return [fileName];
}

function guessEditor() {
  // Explicit config always wins
  if (process.env.REACT_EDITOR) {
    return process.env.REACT_EDITOR;
  }

  // Using `ps x` on OSX we can find out which editor is currently running.
  // Potentially we could use similar technique for Windows and Linux
  if (process.platform === 'darwin') {
    try {
      var output = child_process.execSync('ps x').toString();
      var processNames = Object.keys(COMMON_EDITORS);
      for (var i = 0; i < processNames.length; i++) {
        var processName = processNames[i];
        if (output.indexOf(processName) !== -1) {
          return COMMON_EDITORS[processName];
        }
      }
    } catch(error) {
      // Ignore...
    }
  }

  // Last resort, use old skool env vars
  return process.env.VISUAL || process.env.EDITOR;
}

function printInstructions(title) {
  console.log([
    '',
    chalk.bgBlue.white.bold(' ' + title + ' '),
    '  When you see Red Box with stack trace, you can click any ',
    '  stack frame to jump to the source file. The packager will launch your ',
    '  editor of choice. It will first look at REACT_EDITOR environment ',
    '  variable, then at EDITOR. To set it up, you can add something like ',
    '  export REACT_EDITOR=atom to your ~/.bashrc or ~/.zshrc depending on ',
    '  which shell you use.',
    ''
  ].join('\n'));
}

var _childProcess = null;
function launchEditor(fileName, lineNumber) {
  if (!fs.existsSync(fileName)) {
    return;
  }

  var editor = guessEditor();
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

  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    _childProcess = child_process.spawn('cmd.exe', ['/C', editor].concat(args), {stdio: 'inherit'});
  } else {
    _childProcess = child_process.spawn(editor, args, {stdio: 'inherit'});
  }
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
  });
}

module.exports = launchEditor;
