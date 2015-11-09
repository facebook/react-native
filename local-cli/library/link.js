/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const execSync = require('child_process').execSync;
const eol = require('os').EOL;
const fs = require('fs');
const Promise = require('promise');

/**
 * Adds a third-party library to the current project.
 *
 * Usage:
 * react-native link awesome-camera
 * react-native link awesome-camera@0.2.0
 *
 * Does the following:
 *   npm install --save awesome-camera
 *   If the library contains native Android code, adds it to the build.
 */
function link(argv, config) {
  return new Promise((resolve, reject) => {
    try {
      _link(argv, config);
    } catch (e) {
      reject(e);
      return;
    }
    resolve();
  });
}

function _link(argv, config) {
  // argv examples:
  // ['link', 'awesome-camera']
  // ['link', 'awesome-camera@0.2']
  if (argv.length !== 2) {
    throw 'Please provide one argument (library to install).\n' +
        'Usage example: react-native link awesome-camera';
  }

  const libraryAndVersion = argv[1];
  const library = libraryAndVersion.split('@')[0];

  _npmInstall(libraryAndVersion);
  _maybeLinkAndroid(library);
}

function _npmInstall(library) {
  const command = 'npm install --save ' + library;
  console.log('Running ' + command);
  try {
    execSync(command);
  } catch (e) {
    throw command + ' failed';
  }
}

/**
 * If this library contains Android native code, add it to the build.
 */
function _maybeLinkAndroid(library) {
  if (!_pathExists(`node_modules/${library}/android`)) {
    return;
  }
  if (
    (!_pathExists('android/settings.gradle')) ||
    (!_pathExists('android/app/build.gradle'))) {
    console.log('The library contains native Android code but this is not an ' +
        'Android project, skipping.'
    );
    return;
  }
  if (!_pathExists(`node_modules/${library}/android/build.gradle`)) {
    console.log('Looks like the Android library has incorrect format: ' +
        'android/build.gradle is missing.'
    );
    return;
  }

  // Update settings.gradle
  if (fs.readFileSync('android/settings.gradle', 'utf8').indexOf(`include ':${library}'`) !== -1) {
    console.log('The library is already present in android/settings.gradle.');
  } else {
    fs.appendFileSync('android/settings.gradle',
      `${eol}// ${library} dependency${eol}` +
      `include ':${library}'${eol}` +
      `project(':${library}').projectDir = ` +
          `new File(rootProject.projectDir, '../node_modules/${library}/android')${eol}`
    );
    console.log('Updated android/settings.gradle');
  }

  // Update android/app/build.gradle
  const build = fs.readFileSync('android/app/build.gradle', 'utf8');
  if (build.indexOf(`compile project(":${library}")`) !== -1) {
    console.log('The library is already present in android/app/build.gradle.');
  } else {
    const append = (
      // Include sources
      `    compile project(":${library}")${eol}` +
      // Include libs/*.jar
      `    compile fileTree(dir: "node_modules/${library}/android/libs", include: ["*.jar"])`
    );
    const buildWithDeps = build.replace(
      /dependencies {([^}]*)}/g,
      `dependencies {$1${eol}${append}${eol}}`
    );
    fs.writeFileSync('android/app/build.gradle', buildWithDeps, 'utf8');
    console.log('Updated android/app/build.gradle');
  }
  // We could try to automate this as well.
  // E.g. by convention the package name would end with Package.java.
  console.log('Next step: add the library to your MainActivity.java by calling addPackage().\n' +
    `Look for the package name in node_modules/${library}/android/src/main/java`
  );
}

function _pathExists(path) {
  try {
    const stats = fs.statSync(path);
    return stats.isFile() || stats.isDirectory();
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false;
    }
    throw e;
  }
}

module.exports = link;
