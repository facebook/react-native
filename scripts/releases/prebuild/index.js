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
const {createFramework} = require('./compose-framework');
const {dependencies, platforms} = require('./configuration');
const {cleanFolder} = require('./folders');
const {setupDependencies} = require('./setupDependencies');
const {createSwiftPackageFile} = require('./swift-package');
const path = require('path');
const yargs = require('yargs');

require('../../babel-register').registerForScript();

const THIRD_PARTY_PATH = 'packages/react-native/third-party';
const BUILD_DESTINATION = '.build';

const SCHEME = 'ReactNativeDependencies';

const cli = yargs
  .usage(
    'This script prepares iOS prebuilds for React Native. It downloads the dependencies, prepare them, builds them and creates the XCFrameworks.' +
      'Calling the script with no options will build all the dependencies for all the slices and configurations.',
  )
  .option('setup', {
    alias: 's',
    type: 'boolean',
    describe: 'Download and setup dependencies',
  })
  .option('swiftpackage', {
    alias: 'w',
    type: 'boolean',
    describe: 'Creates the Package.swift file',
  })
  .option('build', {
    alias: 'b',
    type: 'boolean',
    describe: 'Build dependencies/platforms',
  })
  .option('compose', {
    alias: 'c',
    type: 'boolean',
    describe: 'Compose xcframework from built dependencies',
  })
  .option('platforms', {
    alias: 'p',
    type: 'array',
    default: platforms,
    describe: 'Specify one or more platforms to build for',
  })
  .option('dependencies', {
    alias: 'd',
    type: 'array',
    default: dependencies.map(d => d.name),
    describe: 'Specify one or more dependencies',
  })
  .help();

const arrayLike = (value /*: Array<any> */) /*: Array<any> */ =>
  Array.isArray(value) ? value : [value];

/**
 * Main entry point
 */
async function main() {
  const argv = await cli.argv;

  // Verify that the platforms argument is valid
  const invalidPlatforms = arrayLike(argv.platforms).filter(
    rs => !platforms.includes(rs),
  );
  if (invalidPlatforms.length > 0) {
    console.error(`Invalid platform specified: ${invalidPlatforms.join(', ')}`);
    return 0;
  }

  // Verify that the dependencies argument is valid
  const invalidDependencies = arrayLike(argv.dependencies).filter(
    rd => !dependencies.map(d => d.name).includes(rd),
  );
  if (invalidDependencies.length > 0) {
    console.error(
      `Invalid dependency specified: ${invalidDependencies.join(', ')}`,
    );
    return 0;
  }

  // Prepare platforms and dependencies
  const resolvedPlatforms = platforms.filter(p => argv.platforms.includes(p));
  const resolvedDependencies = dependencies.filter(d =>
    argv.dependencies.includes(d.name),
  );

  // Prepare output folders
  const buildFolder = path.resolve(THIRD_PARTY_PATH, BUILD_DESTINATION);
  const rootFolder = path.resolve(THIRD_PARTY_PATH);

  // Are we running all commands?
  const runAllCommands =
    argv.setup == null &&
    argv.swiftpackage == null &&
    argv.build == null &&
    argv.compose == null;

  if (runAllCommands || argv.setup != null) {
    await cleanFolder(rootFolder);
    await setupDependencies(resolved_dependencies, rootFolder);
  }

  if (runAllCommands || argv.swiftpackage != null) {
    // Create Package.swift file
    await createSwiftPackageFile(SCHEME, resolved_dependencies, rootFolder);
  }

  if (runAllCommands || argv.build != null) {
    await cleanFolder(buildFolder);
    await buildDepenencies(
      SCHEME,
      resolved_dependencies,
      resolved_platforms,
      rootFolder,
      buildFolder,
    );
  }

  if (runAllCommands || argv.compose != null) {
    await createFramework(SCHEME, dependencies, rootFolder, buildFolder);
  }

  console.log('');
  console.log('🏁 Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
