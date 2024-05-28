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

// To be able to execute the cli as a yarn script, we have to strip our yarn types.
// This causes problems for some of our dependencies, because they live in Meta internals,
// Github and in NPM:
// - Github and Meta: dynamicly transpile our dependencies. They each have to register on the monorepo
// - NPM: `yarn run build`, and it should update the package.json's exports, main and files
function patchCoreCLIUtilsPackageJSON(patch /*: boolean */) {
  const fs = require('fs');
  const log = require('debug');
  const pkg = JSON.parse(
    fs.readFileSync('../core-cli-utils/package.json', 'utf8'),
  );
  const target = patch ? './src/monorepo.js' : './src/index.flow.js';
  if (pkg.main === target) {
    return;
  }
  pkg.main = target;
  pkg.exports['.'] = target;
  log(
    `Patched: ${JSON.stringify(
      {main: pkg.main, exports: pkg.exports},
      null,
      2,
    )}`,
  );
  fs.writeFileSync(
    '../core-cli-utils/package.json',
    JSON.stringify(pkg, null, 2),
  );
}

module.exports.patchCoreCLIUtilsPackageJSON = patchCoreCLIUtilsPackageJSON;
