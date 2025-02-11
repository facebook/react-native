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

const buildTypes = require('./build-types/buildTypes');
const chalk = require('chalk');
const debug = require('debug');
const {parseArgs} = require('util');

const config = {
  options: {
    debug: {type: 'boolean'},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {debug: debugEnabled, help},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/build-types.js

  [Experimental] Build generated TypeScript types for react-native.
    `);
    process.exitCode = 0;
    return;
  }

  if (debugEnabled) {
    debug.enable('build-types:*');
  }

  console.log(
    '\n' +
      chalk.bold.inverse.yellow(
        'EXPERIMENTAL - Building generated react-native package types',
      ) +
      '\n',
  );

  try {
    // $FlowIgnore[cannot-resolve-module]
    const prepareFlowApiTranslator = require('./prepare-flow-api-translator');
    await prepareFlowApiTranslator();
  } catch (e) {
    console.warn(
      chalk.yellow(
        'WARNING: Failed to build flow-api-translator from source. Using npm version (may be out of date).',
      ),
    );
  }

  await buildTypes();
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
