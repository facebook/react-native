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

const {
  HEADERS_FOLDER,
  RESOURCES_FOLDER,
  SCRIPTS_FOLDER,
  SOURCE_FOLDER,
  TARGET_FOLDER,
} = require('./constants');
const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const util = require('util');

/*::
import type {Dependency} from './types';
import {skip} from "rxjs/operators";
*/

const exec = util.promisify(require('child_process').exec);

const log = (message /*: string */, ...optionalParams /*: Array<mixed> */) =>
  console.log('   → ' + message, ...optionalParams);

/**
 * Main entry point for setting up dependencies
 * @param {*} dependencies
 * @param {*} rootFolder
 */
async function setupDependencies(
  dependencies /*: $ReadOnlyArray<Dependency> */,
  rootFolder /*: string */,
) {
  console.log('✅ Setting up dependencies...');

  // Setup dependencies
  await Promise.all(dependencies.map(dep => setupDepenency(dep, rootFolder)));
}

/**
 * Sets up a single dependency.
 * @param {*} dependency
 * @param {*} destination
 */
async function setupDepenency(
  dependency /*: Dependency */,
  rootFolder /*: string */,
) {
  await downloadDependency(dependency, rootFolder);
  await runPrepareDependencyScript(dependency, rootFolder);
  await createBuildStructure(dependency, rootFolder);
  await createHeaderStructure(dependency, rootFolder);
  await copyResources(dependency, rootFolder);
}

/**
 * Downloads a dependency from a URL and extracts it to a destination folder.
 * @param {*} dependency
 */
async function downloadDependency(
  dependency /*: Dependency */,
  rootFolder /*: string */,
) {
  const filename = `${dependency.name}.tgz`;
  const archiveDestination = `/tmp/${filename}`;
  const command = `curl -L ${dependency.url.toString()} --output ${archiveDestination}`;
  log(`Downloading ${filename}...`);
  await exec(command);

  const targetFolder = path.join(rootFolder, dependency.name, SOURCE_FOLDER);
  log(`Building target folder ${targetFolder}...`);
  fs.mkdirSync(targetFolder, {recursive: true});
  log(`Extracting ${filename} to ${targetFolder}...`);
  await exec(
    `tar -xzf ${archiveDestination} -C ${targetFolder} --strip-components 1`,
  );
  log(`Cleaning up ${filename}...`);
  await exec(`rm ${archiveDestination}`);
}

/**
 * Runs a prepare script for a dependency if it exists
 * @param {*} dependency
 * @param {*} destination
 * @returns
 */
async function runPrepareDependencyScript(
  dependency /*  :Dependency */,
  rootFolder /*: string */,
) {
  if (dependency.prepareScript == null) {
    return;
  }

  // Folder for the dependency source
  const sourceFolder = path.join(rootFolder, dependency.name, SOURCE_FOLDER);

  // Check if the prepare script is a file or a command
  if (dependency.prepareScript && !fs.existsSync(dependency.prepareScript)) {
    log(`Running prepare script for ${dependency.name}...`);
    dependency.prepareScript &&
      execSync(dependency.prepareScript, {cwd: sourceFolder, stdio: 'inherit'});
    return;
  }

  // Target folder for the prepare script
  const targetFolder = path.join(rootFolder, dependency.name, SCRIPTS_FOLDER);
  fs.mkdirSync(targetFolder, {recursive: true});

  const finalPath = path.join(targetFolder, 'prepare.sh');
  log(`Running prepare script for ${dependency.name} in ${finalPath}...`);

  if (dependency.prepareScript) {
    fs.copyFileSync(dependency.prepareScript, finalPath);
    execSync(`${targetFolder}/prepare.sh`, {
      cwd: sourceFolder,
      stdio: 'inherit',
    });
  }
}

/**
 * Creates the structure for the build
 * @param {*} dependency
 * @param {*} rootFolder
 */
async function createBuildStructure(
  dependency /*  :Dependency */,
  rootFolder /*: string */,
) {
  const targetFolder = path.join(rootFolder, dependency.name, TARGET_FOLDER);
  const sourceFolder = path.join(rootFolder, dependency.name, SOURCE_FOLDER);
  log(
    'Creating build structure for dependency',
    dependency.name,
    'in',
    targetFolder,
    'from',
    sourceFolder,
  );
  fs.mkdirSync(targetFolder, {recursive: true});

  // Now let's use glob to get the final list of files
  const sources = dependency.files.sources;
  sources.forEach(source => {
    const sourceFiles = glob.sync(source, {cwd: sourceFolder});
    sourceFiles.forEach(sourceFile => {
      const sourcePath = path.join(sourceFolder, sourceFile);
      const targetPath = path.join(targetFolder, sourceFile);
      // Create the folder structure
      const targetDir = path.dirname(targetPath);
      fs.mkdirSync(targetDir, {recursive: true});
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
    });
  });
}

/**
 * Creates the correct header structure for the dependency. This structure will be copied
 * into the final frameworks under the Headers folder.
 * @param {*} dependency
 * @param {*} rootFolder
 */
async function createHeaderStructure(
  dependency /*  :Dependency */,
  rootFolder /*: string */,
) {
  const targetFolder = path.join(rootFolder, dependency.name, HEADERS_FOLDER);
  const sourceFolder = path.join(rootFolder, dependency.name, SOURCE_FOLDER);
  log('Copying header files for dependency', dependency.name);

  fs.mkdirSync(targetFolder, {recursive: true});

  // Now let's use glob to get the final list of files
  const headers = dependency.files.headers;
  headers.forEach(source => {
    const sourceFiles = glob.sync(source, {cwd: sourceFolder});
    sourceFiles.forEach(sourceFile => {
      // get source path
      const sourcePath = path.join(sourceFolder, sourceFile);
      // get source path relative to the source folder and remove
      // the headerSkipFolderNames if it exists in the dependency
      const resolvedSourcePath = path
        .relative(sourceFolder, sourcePath)
        .replace(dependency.files.headerSkipFolderNames ?? '', '');

      const targetPath = path.join(targetFolder, resolvedSourcePath);

      // Create the folder structure
      const targetDir = path.dirname(targetPath);

      fs.mkdirSync(targetDir, {recursive: true});
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
    });
  });
}

async function copyResources(
  dependency /*  :Dependency */,
  rootFolder /*: string */,
) {
  const resources = dependency.files.resources ?? [];
  if (resources.length === 0) {
    return;
  }

  log(`Copying ${resources.length} resources for dependency`, dependency.name);
  const targetFolder = path.join(
    rootFolder,
    dependency.name,
    TARGET_FOLDER,
    RESOURCES_FOLDER,
  );
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, {recursive: true});
  }

  // Copy all resources
  resources.forEach(source => {
    const sourceFiles = glob.sync(source, {cwd: rootFolder});
    sourceFiles.forEach(sourceFile => {
      const sourcePath = path.resolve(rootFolder, sourceFile);
      const targetPath = path.join(targetFolder, path.basename(sourceFile));
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
    });
  });
}

module.exports = {
  setupDependencies,
};
