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

/*::
import type { Dependency, Destination, Platform } from './types';
*/

/**
 * Builds dependencies for the specified platforms. This function will use the generated
 * Package.swift file together with the extracted dependencies to build the frameworks for
 * the requested platforms.
 */
async function buildDepenencies(
  scheme /*: string */,
  configuration /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  destinations /*: $ReadOnlyArray<Destination> */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log('✅ Building dependencies...');

  await Promise.all(
    destinations.map(destination =>
      buildPlatform(
        scheme,
        configuration,
        destination,
        rootFolder,
        buildFolder,
      ),
    ),
  );

  // Copy headers into framework
  await copyHeadersToFrameworks(scheme, dependencies, rootFolder, buildFolder);
}

/**
 * Builds a single platform.
 */
async function buildPlatform(
  scheme /*: string */,
  configuration /*: string */,
  destination /*: Destination */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log(`Building ${destination}...`);
  const command =
    `xcodebuild -scheme "${scheme}" -destination "generic/platform=${destination}" ` +
    `-derivedDataPath "${buildFolder}" ` +
    `-configuration "${configuration}" ` +
    'SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    DEBUG_INFORMATION_FORMAT=dwarf-with-dsym';

  execSync(command, {cwd: rootFolder, stdio: 'inherit'});
}

/**
 * Copies headers needed from the package to the framework
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

  console.log('Frameworks found:', frameworks.join(', '));
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
    // Delete and recreate the folder
    fs.rmSync(headerFolder, {force: true, recursive: true});
    fs.mkdirSync(headerFolder, {recursive: true});
  });

  // Now we can go through all dependencies and copy header files for each depencendy
  dependencies.forEach(dep => {
    const depHeadersFolder = path.join(
      rootFolder,
      dep.name,
      TARGET_FOLDER,
      HEADERS_FOLDER,
    );
    const publicHeaderFiles = path.join(depHeadersFolder);

    // Get files in public header files
    const headerFiles = getAllFilesRecursively(publicHeaderFiles);
    console.log(
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
