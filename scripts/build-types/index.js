/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

require('../babel-register').registerForScript();

const buildApiSnapshot = require('./BuildApiSnapshot');
const buildGeneratedTypes = require('./buildGeneratedTypes');
const chalk = require('chalk');
const debug = require('debug');
const {parseArgs} = require('util');

const config = {
  options: {
    debug: {type: 'boolean'},
    help: {type: 'boolean'},
    withSnapshot: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {debug: debugEnabled, help, withSnapshot},
    /* $FlowFixMe[incompatible-call] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build-types

  Build generated TypeScript types for react-native.

  Options:
    --withSnapshot    [Experimental] Include API snapshot generation.
    `);
    process.exitCode = 0;
    return;
  }

  if (debugEnabled) {
    debug.enable('build-types:*');
  }

  console.log(
    '\n' +
      chalk.bold.inverse('Building generated react-native package types') +
      '\n',
  );

  await buildGeneratedTypes();

  if (withSnapshot) {
    console.log(
      '\n' +
        chalk.bold.inverse.yellow('EXPERIMENTAL - Building API snapshot') +
        '\n',
    );

    await buildApiSnapshot();
  }
}

if (require.main === module) {
  void main();
}
