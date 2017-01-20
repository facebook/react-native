 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const copyAndReplace = require('../util/copyAndReplace');
const fs = require('fs');
const isValidPackageName = require('../util/isValidPackageName');
const path = require('path');
const walk = require('../util/walk');

/**
 * Creates a new native library with the given name
 */
function library(argv, config, args) {
  if (!isValidPackageName(args.name)) {
    return Promise.reject(
      args.name + ' is not a valid name for a project. Please use a valid ' +
      'identifier name (alphanumeric).'
    );
  }

  const root = process.cwd();
  const libraries = path.resolve(root, 'Libraries');
  const libraryDest = path.resolve(libraries, args.name);
  const source = path.resolve('node_modules', 'react-native', 'Libraries', 'Sample');

  if (!fs.existsSync(libraries)) {
    fs.mkdir(libraries);
  }

  if (fs.existsSync(libraryDest)) {
    return Promise.reject(`Library already exists in ${libraryDest}`);
  }

  walk(source).forEach(f => {
    if (f.indexOf('project.xcworkspace') !== -1 ||
        f.indexOf('.xcodeproj/xcuserdata') !== -1) {
      return;
    }

    const dest = f.replace(/Sample/g, args.name).replace(/^_/, '.');
    copyAndReplace(
      path.resolve(source, f),
      path.resolve(libraryDest, dest),
      {'Sample': args.name}
    );
  });

  console.log('Created library in', libraryDest);
  console.log('Next Steps:');
  console.log('   Link your library in Xcode:');
  console.log(
    '   https://facebook.github.io/react-native/docs/' +
    'linking-libraries-ios.html#content\n'
  );
}

module.exports = {
  name: 'new-library',
  func: library,
  description: 'generates a native library bridge',
  options: [{
    command: '--name <string>',
    description: 'name of the library to generate',
    default: null,
  }],
};
