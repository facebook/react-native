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

/*::
import type { Dependency, Platform } from './types';
import {exec} from "child_process";
*/

/**
 * Composes the final XCFramework from the artifacts in the build folder
 */
async function createFramework(
  scheme /*: string */,
  configuration /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  rootFolder /*: string */,
  buildFolder /*: string */,
) {
  console.log('✅ Composing iOS XCFramework...');

  // Get the build destination path from the prebuild step
  const frameworksOutputFolder = path.join(buildFolder, 'Build', 'Products');
  const frameworks = fs.readdirSync(frameworksOutputFolder);
  console.log('Frameworks found:', frameworks.join(', '));

  const frameworkPaths = frameworks.map(framework =>
    path.join(frameworksOutputFolder, framework),
  );

  const output = path.join(rootFolder, `${scheme}.xcframework`);

  // Check if output already exists and delete it
  fs.rmSync(output, {recursive: true, force: true});

  console.log('Output path:', output);

  const frameworksArgs = frameworkPaths
    .map(
      framework =>
        `-framework ${path.join(
          framework,
          'PackageFrameworks',
          `${scheme}.framework`,
        )}`,
    )
    .join(' ');

  const command = `xcodebuild -create-xcframework ${frameworksArgs} -output ${output} `;
  execSync(command, {stdio: 'inherit'});

  // Copy bundles into the framework
  copyBundles(scheme, dependencies, output, frameworkPaths);

  // Copy Symbols to symbols folder
  const symbolPaths = frameworkPaths.map(framework =>
    path.join(framework, `${scheme}.framework.dSYM`),
  );
  console.log('Copying symbols to symbols folder...');
  const symbolOutput = path.join(rootFolder, 'Symbols');
  fs.mkdirSync(symbolOutput, {recursive: true});
  symbolPaths.forEach(symbol => execSync(`cp -r ${symbol} ${symbolOutput}`));
}

/**
 * Copies the bundles in the source frameworks to the target xcframework inside the xcframework's Resources folder
 */
function copyBundles(
  scheme /*: string */,
  dependencies /*: $ReadOnlyArray<Dependency> */,
  outputFolder /*:string*/,
  frameworkPaths /*:Array<string>*/,
) {
  console.log('Copying bundles to the framework...');

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
      const sourceBundlePath = path.join(frameworkPath, bundleName);
      if (fs.existsSync(sourceBundlePath)) {
        // Target folder - needs to be copied to the resulting framework
        targetArchFolders.forEach(targetArchFolder => {
          const targetBundlePath = path.join(
            targetArchFolder,
            `${scheme}.framework`,
            'Resources',
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
          execSync(`cp -r ${sourceBundlePath} ${targetBundlePath}`);
        });
      } else {
        console.warn(`Bundle ${sourceBundlePath} not found`);
      }
    });
  });
}

module.exports = {createFramework};
