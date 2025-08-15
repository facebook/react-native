/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// To be able to execute the cli as a yarn script, we have to strip our yarn types.
// This causes problems for some of our dependencies, because they live in Meta internals,
// Github and in NPM:
// - Github and Meta: dynamicly transpile our dependencies. They each have to register on the monorepo
// - NPM: `yarn run build`, and it should update the package.json's exports, main and files
function patchCoreCLIUtilsPackageJSON(patch /*: boolean */) {
  const log = require('debug');
  const fs = require('fs');
  const path = require('path');

  function repositoryPath(relativePath /*: string */) {
    return path.join(__dirname, '..', '..', '..', relativePath);
  }

  const packageJsonPath = repositoryPath(
    'packages/core-cli-utils/package.json',
  );

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
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
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
}

module.exports.patchCoreCLIUtilsPackageJSON = patchCoreCLIUtilsPackageJSON;
