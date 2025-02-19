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

require('../babel-register').registerForScript();

/*::
import type {Folder, FilesToKeep, Dependency} from './ios-prebuilds/dependencies';
*/

const dependencies /*: $ReadOnlyArray<Dependency> */ = require('./ios-prebuilds/dependencies');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const {parseArgs} = require('util');

const exec = util.promisify(require('child_process').exec);

const THIRD_PARTY_PATH = 'packages/react-native/third-party';
const BUILD_DESTINATION = '.build';

async function _downloadDependency(
  name /*: string*/,
  url /*: URL*/,
  destination /*: string*/,
) {
  const filename = `${name}.tgz`;
  const archiveDestination = `/tmp/${filename}`;
  const command = `curl -L ${url.toString()} --output ${archiveDestination}`;
  console.log(`Downloading ${filename}...`);
  await exec(command);

  fs.mkdirSync(destination, {recursive: true});
  console.log(`Extracting ${filename} to ${destination}...`);
  await exec(
    `tar -xzf ${archiveDestination} -C ${destination} --strip-components 1`,
  );
  console.log(`Cleaning up ${filename}...`);
  await exec(`rm ${archiveDestination}`);
}

function _prepareDependency(scriptPath /*: string*/, destination /*: string*/) {
  console.log(`Running ${scriptPath}...`);
  const finalPath = path.join(destination, 'prepare.sh');
  fs.copyFileSync(scriptPath, finalPath);
  execSync('./prepare.sh', {cwd: destination, stdio: 'inherit'});
}

function _removeUnnecessaryFiles(
  filesToKeep /*: FilesToKeep*/,
  destination /*: string*/,
) {
  const backupPath = `${destination}_backup`;
  fs.mkdirSync(backupPath, {recursive: true});

  console.log('Moving headers to backup folder...');
  const headers = filesToKeep.headers;
  if (headers instanceof RegExp) {
    const files = execSync(`find ${destination} -type f -name "*.h"`)
      .toString()
      .trim()
      .split('\n');
    for (const file of files) {
      if (headers.test(file)) {
        const relativeFilePath = path
          .relative(backupPath, file)
          .split('/')
          .slice(2)
          .join('/');
        const destinationFile = `${backupPath}/${relativeFilePath}`;

        fs.mkdirSync(path.dirname(destinationFile), {recursive: true});
        fs.copyFileSync(file, destinationFile);
      }
    }
  } else {
    for (const file of headers) {
      const filePath = path.join(destination, file);
      const destFilePath = path.join(`${destination}_backup`, file);
      fs.copyFileSync(filePath, destFilePath);
    }
  }

  console.log('Moving sources to backup folder...');
  for (const file of filesToKeep.sources) {
    const filePath = path.join(destination, file);
    const destFilePath = path.join(`${destination}_backup`, file);
    fs.copyFileSync(filePath, destFilePath);
  }

  console.log('Cleaning up...');
  fs.rmSync(destination, {recursive: true, force: true});
  fs.renameSync(`${destination}_backup`, destination);
}

async function setupDependency(
  dependency /*: Dependency*/,
) /*: Promise<void> */ {
  const {name, url} = dependency;
  const destination = path.join(THIRD_PARTY_PATH, name);

  await _downloadDependency(name, url, destination);

  if (dependency.prepareScript) {
    _prepareDependency(dependency.prepareScript, destination);
  }

  _removeUnnecessaryFiles(dependency.filesToKeep, destination);
}

async function build(
  swiftPMFolder /*:string*/,
  buildDestinationPath /*: string */,
) {
  console.log(`Clean up ${buildDestinationPath}`);
  fs.rmSync(buildDestinationPath, {recursive: true, force: true});

  //TODO: Add support for mac,  Mac (catalyst), tvOS, xros and xrsimulator
  const platforms = ['generic/platform=iOS', 'generic/platform=iOS Simulator'];
  for (const platform of platforms) {
    console.log(`Building ReactNativeDependencies for ${platform}`);
    const command = `xcodebuild -scheme "ReactNativeDependencies" -destination "${platform}" -derivedDataPath "${BUILD_DESTINATION}"`;
    execSync(command, {cwd: swiftPMFolder, stdio: 'inherit'});
  }
}

async function copyHeadersToFrameworks(
  dependency /*: Dependency*/,
  swiftPMFolder /*:string*/,
  buildDestinationPath /*: string */,
) {
  const headers = dependency.filesToKeep.headers;
  const {name} = dependency;
  const sourceCodePath = path.join(THIRD_PARTY_PATH, name);

  let filePathMapping /*: { [string]: string }*/ = {};
  if (headers instanceof RegExp) {
    const files = execSync(`find ${sourceCodePath} -type f -name "*.h"`)
      .toString()
      .trim()
      .split('\n');
    for (const file of files) {
      if (headers.test(file)) {
        const relativeFilePath = path
          .relative(buildDestinationPath, file)
          .split('/')
          .slice(
            dependency.copyHeaderRule &&
              dependency.copyHeaderRule === 'skipFirstFolder'
              ? 3 // Skip ../{name}/firstFolder
              : 2, // Skip ../{name} which will be duplicated.
          )
          .join('/');
        filePathMapping[file] = relativeFilePath;
      }
    }
  } else {
    headers.forEach(file => {
      filePathMapping[path.join(sourceCodePath, file)] = file;
    });
  }

  console.log(`Copying headers for ${name} to frameworks...`);
  const productsFolder = path.join(buildDestinationPath, 'Build', 'Products');
  Object.entries(filePathMapping).forEach(([sourceFile, relativeFilePath]) => {
    // For each file, we need to copy it in every slice of the frameworks we built.
    fs.readdirSync(productsFolder).forEach(productFolderPath => {
      const destinationFile = path.join(
        productsFolder,
        productFolderPath,
        'PackageFrameworks',
        'ReactNativeDependencies.framework',
        'Headers',
        relativeFilePath,
      );
      fs.mkdirSync(path.dirname(destinationFile), {recursive: true});
      fs.copyFileSync(sourceFile, destinationFile);
    });
  });
}

function composeXCFrameworks(
  thirdPartyFolder /*: string */,
  buildDestinationPath /*: string */,
) {
  console.log('Composing XCFrameworks...');
  const frameworksFolder = path.join(buildDestinationPath, 'Build', 'Products');
  const frameworks = fs.readdirSync(frameworksFolder);
  const frameworkPaths = frameworks.map(framework =>
    path.join(
      frameworksFolder,
      framework,
      'PackageFrameworks',
      'ReactNativeDependencies.framework',
    ),
  );
  const frameworksArgs = frameworkPaths
    .map(framework => `-framework ${framework}`)
    .join(' ');
  const command = `xcodebuild -create-xcframework ${frameworksArgs} -output ${path.join(thirdPartyFolder, 'ReactNativeDependencies.xcframework')}`;
  execSync(command, {stdio: 'inherit'});
}

const config = {
  options: {
    task: {
      type: 'string', // valid values: 'all', 'prepare', 'build', 'create-xcframework'
      default: 'all',
      short: 'o',
    },
    slice: {
      type: 'string', // valid values: 'all', 'ios', 'ios-simulator', 'mac', 'mac-catalyst', 'tvos', 'xros', 'xrsimulator'
      default: 'all',
      short: 's',
    },
    configurations: {
      type: 'string', // valid values: 'all', 'Debug', 'Release',
      default: 'all',
      short: 'c',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
};

function printHelp() {
  console.log(`
  Usage: node ./scripts/releases/prepare-ios-prebuilds.js [OPTIONS]

  This script prepares iOS prebuilds for React Native. It downloads the dependencies, prepare them, builds them and creates the XCFrameworks.

  Calling the script with no options will build all the dependencies for all the slices and configurations.

  Options:
    --task, -t: the specific task that needs to be carried on. Default value is 'all'. Valid values are 'all', 'prepare', 'build', 'create-xcframework'.
    --slice, -s: the specific slice that needs to be built. Default value is 'all'. Valid values are 'all', 'ios', 'ios-simulator', 'mac', 'mac-catalyst', 'tvos', 'xros', 'xrsimulator'.
    --configurations, -c: the specific configurations that needs to be built. Default value is 'all'. Valid values are 'all', 'Debug', 'Release'.
    --help, -h: print this help message.
    `);
}

async function main() {
  const {
    values: {task, slice, configurations, help},
  } = parseArgs(config);

  if (help) {
    printHelp();
    return;
  }

  console.log('Starting iOS prebuilds preparation...');
  const thirdPartyFolder = path.join(process.cwd(), THIRD_PARTY_PATH);
  const buildDestinationPath = path.join(thirdPartyFolder, BUILD_DESTINATION);

  if (task === 'all' || task === 'prepare') {
    await Promise.all(
      dependencies.map(dependency => setupDependency(dependency)),
    );
  }

  if (task === 'all' || task === 'build') {
    await build(thirdPartyFolder, buildDestinationPath);

    await Promise.all(
      dependencies.map(dependency =>
        copyHeadersToFrameworks(
          dependency,
          thirdPartyFolder,
          buildDestinationPath,
        ),
      ),
    );
  }

  if (task === 'all' || task === 'create-xcframework') {
    composeXCFrameworks(thirdPartyFolder, buildDestinationPath);
  }
  console.log('Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
