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

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message /*: string */, ...optionalParams /*: Array<mixed> */) =>
  console.log('   → ' + message, ...optionalParams);

/*::
import type { Dependency, Platform } from './types';
*/

/**
 * Composes the final XCFramework from the artifacts in the build folder
 * @param {*} rootFolder
 * @param {*} buildFolder
 */
async function createFramework(
  scheme /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log('✅ Composing iOS XCFramework...');

  // Get the build destination path from the prebuild step
  const frameworksOutputFolder = path.join(buildFolder, 'Build', 'Products');
  const frameworks = fs.readdirSync(frameworksOutputFolder);
  log('Frameworks found:', frameworks.join(', '));

  const frameworkPaths = frameworks.map(framework =>
    path.join(
      frameworksOutputFolder,
      framework,
      'PackageFrameworks',
      `${scheme}.framework`,
    ),
  );

  const output = path.join(rootFolder, `${scheme}.xcframework`);

  // Check if output already exists and delete it
  if (fs.existsSync(output)) {
    fs.rmSync(output, {recursive: true, force: true});
  }
  log('Output path:', output);

  const frameworksArgs = frameworkPaths
    .map(framework => `-framework ${framework}`)
    .join(' ');

  const command = `xcodebuild -create-xcframework ${frameworksArgs} -output ${output}`;
  execSync(command, {stdio: 'inherit'});

  // Copy bundles into the framework
  copyBundles(scheme, dependencies, output, frameworkPaths);
}

function copyBundles(
  scheme /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  outputFolder /*:string*/,
  frameworkPaths /*:Array<string>*/,
) {
  log('Copying bundles to the framework...');

  // Let's precalculate the target folder. It is the xcframework's output folder with
  // all its targets.
  const targetArchFolders = fs
    .readdirSync(outputFolder)
    .map(p => path.join(outputFolder, p))
    .filter(p => fs.statSync(p).isDirectory());

  // For each framework (in frameworkPaths), copy the bundles from the source folder.
  // A bundle is the name of the framework + _ + target name + .bundle. We can
  // check if the target has a bundle by checking if it defines one or more resources.
  frameworkPaths.forEach(frameworkPath => {
    dependencies.forEach(dep => {
      const resources = dep.files.resources;
      if (!resources || resources.length === 0) {
        return;
      }

      // Get bundle source folder
      const bundleName = `${scheme}_${dep.name}.bundle`;
      const sourceBundlePath = path.join(frameworkPath, '../../', bundleName);
      if (fs.existsSync(sourceBundlePath)) {
        // Target folder - needs to be copied to the resulting framework
        targetArchFolders.forEach(targetArchFolder => {
          const targetBundlePath = path.join(
            targetArchFolder,
            `${scheme}.framework`,
            'Resources',
            bundleName,
          );
          if (
            !fs.existsSync(path.join(targetArchFolder, `${scheme}.framework`))
          ) {
            console.warn("Target Bundle path doesn't exist", targetBundlePath);
          }
          if (!fs.existsSync(path.dirname(sourceBundlePath))) {
            console.warn("Source bundle doesn't exist", sourceBundlePath);
          }

          // A bundle is a directory, so we need to copy the whole directory
          copyDirectory(sourceBundlePath, targetBundlePath);
        });
      } else {
        console.warn(`Bundle ${sourceBundlePath} not found`);
      }
    });
  });
}

/**
 * Copies a bundle - which is basically a directory - from one location to another
 * @param {*} source
 * @param {*} target
 */
function copyDirectory(source /*: string*/, target /*: string*/) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, {recursive: true});
  }
  // Read all files in source
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourceFile = path.join(source, file);
    const targetFile = path.join(target, file);
    if (fs.statSync(sourceFile).isDirectory()) {
      copyDirectory(sourceFile, targetFile);
    } else {
      fs.copyFileSync(sourceFile, targetFile);
    }
  });
}

module.exports = {createFramework};
