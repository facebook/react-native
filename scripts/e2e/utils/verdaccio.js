/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const {REPO_ROOT} = require('../../consts');
const {execSync, spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

const NPM_CONFIG_PATH = path.join(REPO_ROOT, '.npmrc');
const VERDACCIO_CONFIG_PATH = path.join(__dirname, '..', 'verdaccio.yml');
const VERDACCIO_STORAGE_PATH = '/tmp/verdaccio';
const VERDACCIO_SERVER_URL = 'http://localhost:4873';

/**
 * Configure and run a local Verdaccio server. This is an npm proxy that can be
 * used with `npm publish` and `npm install`, configured in
 * `scripts/e2e/verdaccio.yml`.
 */
function setupVerdaccio() /*: number */ {
  const {host} = new URL(VERDACCIO_SERVER_URL);

  // NOTE: Reading from/writing to an .npmrc in a workspaces project root is
  // invalid from npm 9.x. Keyed config, such as `--registry`, should be
  // specified in env vars or command invocations instead.
  // See https://github.com/npm/cli/issues/6099
  fs.writeFileSync(NPM_CONFIG_PATH, `//${host}/:_authToken=secretToken\n`);

  const verdaccioProcess = spawn(
    'npx',
    ['verdaccio@5.16.3', '--config', VERDACCIO_CONFIG_PATH],
    {env: {...process.env, VERDACCIO_STORAGE_PATH}},
  );

  execSync(`npx wait-on@6.0.1 ${VERDACCIO_SERVER_URL}`);

  return verdaccioProcess.pid;
}

module.exports = {
  setupVerdaccio,
  VERDACCIO_SERVER_URL,
  VERDACCIO_STORAGE_PATH,
};
