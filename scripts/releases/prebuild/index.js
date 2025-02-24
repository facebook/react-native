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

const {buildDepenencies} = require('./build');
const {getCLIConfiguration} = require('./cli');
const {createFramework} = require('./compose-framework');
const {cleanFolder} = require('./folders');
const {setupDependencies} = require('./setupDependencies');
const {createSwiftPackageFile} = require('./swift-package');
const path = require('path');

require('../../babel-register').registerForScript();

const THIRD_PARTY_PATH = 'packages/react-native/third-party';
const BUILD_DESTINATION = '.build';

const SCHEME = 'ReactNativeDependencies';

/**
 * Main entry point
 */
async function main() {
  const cli = await getCLIConfiguration();
  if (cli == null) {
    return 0;
  }

  const buildFolder = path.resolve(THIRD_PARTY_PATH, BUILD_DESTINATION);
  const rootFolder = path.resolve(THIRD_PARTY_PATH);

  if (cli.tasks.setup) {
    await cleanFolder(rootFolder);
    await setupDependencies(cli.dependencies, rootFolder);
  }

  if (cli.tasks.swiftpackage) {
    // Create Package.swift file
    await createSwiftPackageFile(SCHEME, cli.dependencies, rootFolder);
  }

  if (cli.tasks.build) {
    await cleanFolder(buildFolder);
    await buildDepenencies(
      SCHEME,
      cli.dependencies,
      cli.platforms,
      rootFolder,
      buildFolder,
    );
  }

  if (cli.tasks.compose) {
    await createFramework(SCHEME, cli.dependencies, rootFolder, buildFolder);
  }

  console.log('');
  console.log('🏁 Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
