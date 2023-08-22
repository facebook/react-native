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

const {parseArgs} = require('@pkgjs/parseargs');
const fs = require('fs');
const path = require('path');
const {BUILD_DIR, PACKAGES_DIR} = require('./build');
const {buildConfig} = require('./config');

const config = {
  options: {
    help: {type: 'boolean'},
  },
};

function clean() {
  const {
    values: {help},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/clean.js

  Clean build directories for all packages defined in ./scripts/build/config.js.
    `);
    process.exitCode = 0;
    return;
  }

  for (const packageName of Object.keys(buildConfig.packages)) {
    fs.rmSync(path.join(PACKAGES_DIR, packageName, BUILD_DIR), {
      force: true,
      recursive: true,
    });
  }

  process.exitCode = 0;
}

if (require.main === module) {
  clean();
}
