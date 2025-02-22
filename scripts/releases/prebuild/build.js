/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {HEADERS_FOLDER, TARGET_FOLDER} = require('./constants');
const {getAllFilesRecursively} = require('./folders');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message /*: string */, ...optionalParams /*: Array<mixed> */) =>
  console.log('   → ' + message, ...optionalParams);

/*::
import type { Dependency, Platform } from './types';
*/

/**
 * Builds the dependencies for the specified platforms
 * @param {*} dependencies
 * @param {*} platforms
 * @param {*} destination
 */
async function buildDepenencies(
  scheme /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  platforms /*: $ReadOnlyArray<Platform> */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log('✅ Building dependencies...');

  await Promise.all(
    platforms.map(platform =>
      buildPlatform(scheme, platform, rootFolder, buildFolder),
    ),
  );

  // Copy headers into framework
  await copyHeadersToFrameworks(scheme, dependencies, rootFolder, buildFolder);
}

/**
 * Builds a single platform.
 * @param {*} scheme
 * @param {*} platform
 * @param {*} rootFolder
 * @param {*} buildFolder
 */
async function buildPlatform(
  scheme /*: string */,
  platform /*: Platform */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  log(`Building ${platform}...`);
  const command = `xcodebuild -scheme "${scheme}" -destination "generic/platform=${platform}" -derivedDataPath "${buildFolder}"`;
  execSync(command, {cwd: rootFolder, stdio: 'inherit'});
}

/**
 * Copies headers needed from the package to the framework
 * @param {*} scheme
 * @param {*} dependencies
 * @param {*} rootFolder
 * @param {*} buildFolder
 */
async function copyHeadersToFrameworks(
  scheme /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  const frameworkFolder = path.join(buildFolder, 'Build', 'Products');
  const frameworks = fs
    .readdirSync(frameworkFolder)
    .filter(f => fs.statSync(path.join(frameworkFolder, f)).isDirectory());

  log('Frameworks found:', frameworks.join(', '));
  const frameworkPaths = frameworks.map(framework =>
    path.join(frameworkFolder, framework),
  );

  // Create Header folder
  frameworkPaths.forEach(fp => {
    const headerFolder = path.join(
      fp,
      'PackageFrameworks',
      `${scheme}.framework`,
      'Headers',
    );
    if (fs.existsSync(headerFolder)) {
      // Delete
      fs.rmSync(headerFolder, {force: true, recursive: true});
    }
    // Create
    fs.mkdirSync(headerFolder, {recursive: true});
  });

  // Now we can go through all dependencies and copy header files for each depencendy
  dependencies.forEach(dep => {
    const depHeadersFolder = path.join(rootFolder, dep.name, HEADERS_FOLDER);
    const publicHeaderFiles = path.join(depHeadersFolder);

    // Get files in public header files
    const headerFiles = getAllFilesRecursively(publicHeaderFiles);
    log(
      `Copying ${headerFiles.length} headers from "${dep.name}" to framework.`,
    );

    // Copy files into headers in framework
    headerFiles.map(p => {
      frameworkPaths.forEach(fp => {
        const destination = path.join(
          fp,
          'PackageFrameworks',
          `${scheme}.framework`,
          'Headers',
          p.replace(publicHeaderFiles, ''),
        );

        // Create folder if it doesn't exist
        if (!fs.existsSync(path.dirname(destination))) {
          fs.mkdirSync(path.dirname(destination), {
            force: true,
            recursive: true,
          });
        }
        // Copy
        fs.copyFileSync(p, destination);
      });
    });
  });
}

module.exports = {
  buildDepenencies,
};
