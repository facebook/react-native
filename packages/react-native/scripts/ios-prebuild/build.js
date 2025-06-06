/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
import type {Destination} from './types';
*/

const {createLogger} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const buildLog = createLogger('SPM');

function computeProductsFolder(outputFolder /*: string */) /*: string */ {
  return path.join(outputFolder, 'Build', 'Products');
}

function computeFrameworkPaths(
  productsFolder /*: string */,
) /*: Array<string> */ {
  // The frameworks are in the products folder under a platform/buildType folder and are directories ending with .framework
  const frameworks = glob.sync('**/*.framework', {
    cwd: productsFolder,
    absolute: true,
  });

  if (frameworks.length === 0) {
    throw new Error(
      `No frameworks found in the output folder: ${productsFolder}`,
    );
  }

  const frameworkPaths = frameworks.filter(p => p.endsWith('React.framework'));
  if (frameworkPaths.length === 0) {
    throw new Error(
      `No React.framework found in the output folder: ${productsFolder}`,
    );
  }

  return frameworkPaths;
}

function buildSwiftPackage(
  rootFolder /*: string */,
  buildFolder /*: string */,
  buildType /*: 'debug' | 'release' */,
  platform /*: Destination */,
  outputFolder /*: string */,
) {
  const buildCommand =
    `xcodebuild -scheme React -destination "generic/platform=${platform}" -derivedDataPath "${outputFolder}" ` +
    `-configuration "${buildType}" SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES OTHER_SWIFT_FLAGS="-no-verify-emitted-module-interface"`;
  buildLog(`Building Swift package for ${buildType}`);
  buildLog(buildCommand);

  execSync(buildCommand, {
    cwd: rootFolder,
    stdio: 'inherit',
  });

  // Use glob to find all the frameworks in the output folder
  const productsFolder = computeProductsFolder(outputFolder);
  if (!fs.existsSync(productsFolder)) {
    throw new Error(
      `Output folder does not exist: ${productsFolder}. Did the build fail?`,
    );
  }

  const frameworkPaths = computeFrameworkPaths(productsFolder);
  buildLog('React.frameworks:');
  frameworkPaths.forEach(p => {
    buildLog('  ' + p);
  });
}

module.exports = {
  buildSwiftPackage,
  computeFrameworkPaths,
  computeProductsFolder,
};
