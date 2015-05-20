'use strict';

var path = require('path');
var fs = require('fs');
var utils = require('./generator-utils');

function showHelp() {
  console.log([
    'Usage: react-native new-library <LibraryName>',
    ''
  ].join('\n'));
  process.exit(1);
}

function newLibrary(libraryName) {
  var root = process.cwd();
  var libraries = path.resolve(root, 'Libraries');
  var libraryDest = path.resolve(libraries, libraryName);
  var source = path.resolve('node_modules', 'react-native', 'Libraries', 'Sample') + '/';

  if (!fs.existsSync(libraries)) {
    fs.mkdir(libraries);
  }

  if (fs.existsSync(libraryDest)) {
    console.log('Library already exists in', libraryDest);
    process.exit(1);
  }

  utils.walk(source).forEach(function(f) {
    f = f.replace(source, ''); // Strip off absolute path
    if (f === 'project.xcworkspace' || f.indexOf('.xcodeproj/xcuserdata') !== -1) {
      return;
    }

    var dest = f.replace(/Sample/g, libraryName).replace(/^_/, '.');
    utils.copyAndReplace(
      path.resolve(source, f),
      path.resolve(libraryDest, dest),
      { 'Sample': libraryName }
    );
  });

  console.log('Created library in', libraryDest);
  console.log('Next Steps:');
  console.log('   Link your library in Xcode:');
  console.log('   https://facebook.github.io/react-native/docs/linking-libraries.html#content');
  console.log('');
}

module.exports = {
  init: function(args) {
    var libraryName = args[1];
    if (!libraryName) {
      showHelp();
    }
    utils.validatePackageName(libraryName);

    newLibrary(libraryName);
  }
};
