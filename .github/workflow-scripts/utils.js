/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {execSync} = require('child_process');

function run(cmd) {
  return execSync(cmd, 'utf8').toString().trim();
}

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function getNpmPackageInfo(pkg, versionOrTag) {
  return fetch(`https://registry.npmjs.org/${pkg}/${versionOrTag}`).then(resp =>
    resp.json(),
  );
}

const log = (...args) => console.log(...args);

module.exports = {
  log,
  getNpmPackageInfo,
  sleep,
  run,
};
