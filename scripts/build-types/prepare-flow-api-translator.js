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

const {REPO_ROOT} = require('../consts');
const chalk = require('chalk');
const debug = require('debug');
const fs = require('fs');
const path = require('path');
const util = require('util');
const {parseArgs} = require('util');
const exec = util.promisify(require('child_process').exec);

const HERMES_PARSER_DIR = path.join(
  REPO_ROOT,
  '../../static_h/tools/hermes-parser/js',
);

const HERMES_PARSER_TOOLS = [
  'flow-api-translator',
  'babel-plugin-syntax-hermes-parser',
  'hermes-eslint',
  'hermes-estree',
  'hermes-parser',
  'hermes-transform',
  'prettier-plugin-hermes-parser',
];

const config = {
  options: {
    debug: {type: 'boolean'},
    help: {type: 'boolean'},
  },
};

/**
 * Temporary script to build and set up flow-api-translator and its dependencies
 * built from source. flow-api-translator is being actively developed and we want
 * to use the latest available version without the need to wait for a new release.
 *
 * This script is only present in fbsource and is not synced to GitHub.
 */
async function main() {
  const {
    values: {debug: debugEnabled, help},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/prepare-flow-api-translator.js

  [Experimental] Build local version of flow-api-translator and setup scripts to use it.
    `);
    process.exitCode = 0;
    return;
  }

  if (debugEnabled) {
    debug.enable('build-types:*');
  }

  // All of the hermes-parser tools are built together, we only need to check one of them.
  if (
    fs.existsSync(path.join(HERMES_PARSER_DIR, HERMES_PARSER_TOOLS[0], 'dist'))
  ) {
    console.log(chalk.bold.inverse.yellow('Setting up flow-api-translator'));
  } else {
    console.log(
      chalk.bold.inverse.yellow(
        'Building flow-api-translator locally, this may take a while...',
      ),
    );
    await exec('yarn build', {
      cwd: HERMES_PARSER_DIR,
    });
  }

  await Promise.all(
    HERMES_PARSER_TOOLS.map(async tool => {
      await execWithDebug(`rm -rf ./node_modules/${tool}`);
      await execWithDebug(
        `cp -r ${path.join(HERMES_PARSER_DIR, tool)} ./node_modules/${tool}`,
      );
    }),
  );

  console.log(chalk.bold.yellow('flow-api-translator is set up') + '\n');
}

async function execWithDebug(cmd /*: string*/) {
  debug('build-types:prepare-flow-api-translator')(cmd);
  return exec(cmd);
}

module.exports = main;

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
