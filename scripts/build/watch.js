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

const chalk = require('chalk');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const {getBuildPath, buildFile, PACKAGES_DIR, SRC_DIR} = require('./build');
const {buildConfig} = require('./config');

let changedFiles /*: Set<string> */ = new Set();

function watch() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help')) {
    console.log(`
  Usage: node ./scripts/build/watch.js

  Watch files for changes and rebuild on change (development). Watches all
  packages defined in ./scripts/build/config.js.
    `);
    process.exit(0);
  }

  const watcher = chokidar.watch(
    Object.keys(buildConfig.packages).map(packageName =>
      path.resolve(PACKAGES_DIR, packageName, SRC_DIR),
    ),
  );

  watcher.on('ready', () => {
    watcher.on('change', handleChange);
    watcher.on('add', handleChange);
    watcher.on('unlink', handleUnlink);
  });

  setInterval(() => {
    const files = Array.from(changedFiles.values());

    if (files.length) {
      changedFiles = new Set();
      files.forEach(file => buildFile(file));
    }
  }, 100);

  console.log('\n' + chalk.bold.inverse('Watching for changes...') + '\n');
}

function handleChange(filePath /*: string */) {
  changedFiles.add(filePath);
}

function handleUnlink(filePath /*: string */) {
  const buildPath = getBuildPath(filePath);
  fs.rm(buildPath, {force: true});
  fs.rm(buildPath + '.flow', {force: true});
}

if (require.main === module) {
  watch();
}
