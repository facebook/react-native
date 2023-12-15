/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {echo, exit} = require('shelljs');
const forEachPackage = require('../for-each-package');
const yargs = require('yargs');

const {
  argv: {private, public},
} = yargs
  .option('private', {
    type: 'boolean',
    describe: 'Only list private packages',
  })
  .option('public', {
    type: 'boolean',
    describe: 'Only list public packages',
  })
  .strict();

const main = () => {
  forEachPackage(
    (_packageAbsolutePath, _packageRelativePathFromRoot, packageManifest) => {
      const packageName = packageManifest.name;
      const isPublic = !packageManifest.private;
      if ((public && isPublic) || (private && !isPublic)) {
        echo(`${packageName} ${packageManifest.version}`);
      } else if (!private && !public) {
        echo(
          `${isPublic ? '\u{1F4E6}' : '\u{1F512}'} ${packageName} ${
            packageManifest.version
          }`,
        );
      }
    },
    {includeReactNative: true},
  );
  exit(0);
};

main();
