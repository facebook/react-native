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

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const exec = util.promisify(require('child_process').exec);

const THIRD_PARTY_PATH = 'packages/react-native/third-party';
const BUILD_DESTINATION = '.build';

/*::
type Folder = RegExp;

// We need to pass through the downloaded files and only keep the ones highlighted here.
// We can delete the rest of the files.
type FilesToKeep = $ReadOnly<{
  headers: Folder | $ReadOnlyArray<string>,
  sources: $ReadOnlyArray<string>,
}>;


type Dependency = $ReadOnly<{
  name: string,
  version: string,
  url: URL,
  prepareScript?: string,
  filesToKeep: FilesToKeep,
  copyHeaderRule?: 'skipFirstFolder', // We can use this field to handle specifics of 3rd party libraries
}>;
*/

const dependencies /*: $ReadOnlyArray<Dependency> */ = [
  {
    name: 'glog',
    version: '0.3.5',
    url: new URL(
      'https://github.com/google/glog/archive/refs/tags/v0.3.5.tar.gz',
    ),
    prepareScript: './packages/react-native/scripts/ios-configure-glog.sh',
    filesToKeep: {
      headers: /src(\/(glog|base))?\/[a-zA-Z0-9_-]+\.h$/, // Keep all headers in src, src/glog and src/base
      sources: [
        'src/demangle.cc',
        'src/logging.cc',
        'src/raw_logging.cc',
        'src/signalhandler.cc',
        'src/symbolize.cc',
        'src/utilities.cc',
        'src/vlog_is_on.cc',
      ],
    },
    copyHeaderRule: 'skipFirstFolder',
  },
];

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

async function main() {
  console.log('Starting iOS prebuilds preparation...');

  const thirdPartyFolder = path.join(process.cwd(), THIRD_PARTY_PATH);
  const buildDestinationPath = path.join(thirdPartyFolder, BUILD_DESTINATION);

  await Promise.all(dependencies.map(setupDependency));

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

  composeXCFrameworks(thirdPartyFolder, buildDestinationPath);
  console.log('Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
