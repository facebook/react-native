/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {execSync} = require('child_process');

function run(...cmd) {
  return execSync(cmd, 'utf8').toString().trim();
}
module.exports.run = run;

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
module.exports.sleep = sleep;

async function getNpmPackageInfo(pkg, versionOrTag) {
  return fetch(`https://registry.npmjs.org/${pkg}/${versionOrTag}`).then(resp =>
    res.json(),
  );
}
module.exports.getNpmPackageInfo = getNpmPackageInfo;

module.exports.log = (...args) => console.log(...args);
