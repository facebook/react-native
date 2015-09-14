'use strict';

var path = require('path');
var execSync = require('child_process').execSync;

function generateImports(projectNames, flags) {
  var reactNativeRoot = path.join(process.cwd(), 'node_modules/react-native');
  var command;

  if (flags.out) {
    command = 'find %%%% -name "*.h" | awk -F\'/\' \'{print "#import \\""$NF"\\""}\' >> ' + flags.out;
  } else {
    command = 'find %%%% -name "*.h" | awk -F\'/\' \'{print "#import \\""$NF"\\""}\'';
  }

  for (var index = 0; index < projectNames.length; index++) {
    var projectRelativePath = _getPath(reactNativeRoot, projectNames[index]);
    var projectPath = path.join(reactNativeRoot, projectRelativePath);
    if (flags.out) {
      execSync(command.replace('%%%%', projectPath));
    } else {
      console.log(execSync(command.replace('%%%%', projectPath), {encoding: 'utf8'}));
    }
  }
}

function _getPath(reactNativeRoot, projectName) {
  var findOutput = execSync('find ' + reactNativeRoot + ' -name ' + projectName + '.xcodeproj', {encoding: 'utf8'});
  if (findOutput.length > 0) {
    findOutput = findOutput.replace(reactNativeRoot + '/', '');
    findOutput = findOutput.replace('/' + projectName + '.xcodeproj\n', '');
  }
  return findOutput;
}

function showHelp() {
  console.log([
    'Usage: react-native swift-bridge [options] <project1>[,<project2>]',
    '',
    'Each project name must match the xcode project name',
    'Options:',
    '  --out\t\tspecify the output file',
  ].join('\n'));
  process.exit(1);
}

module.exports = {
  init: function(args) {
    var projectNames = [];
    var flags = {
      help: args.indexOf('--help') !== -1,
      out: args.indexOf('--out') !== -1 ? args[args.indexOf('--out') + 1] : false,
    };

    if (flags.help) {
      showHelp();
    } else {
      if (args.length === 0 ||
          args[args.length - 1].startsWith('--') ||
          (args.length > 1 && args[args.length - 2] === '--out')
          ) {
        console.log('No project name was passed in');
        showHelp();
      } else {
        projectNames = args[args.length - 1].split(',');
      }

      generateImports(projectNames, flags);
    }
  }
};
