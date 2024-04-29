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

const {
  combineSchemasInFileListAndWriteToFile,
} = require('./combine-js-to-schema');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'platform',
  })
  .option('e', {
    alias: 'exclude',
  })
  .parseSync();

const [outfile, ...fileList] = argv._;
const platform: ?string = argv.platform;
const exclude: string = argv.exclude;
const excludeRegExp: ?RegExp =
  exclude != null && exclude !== '' ? new RegExp(exclude) : null;

combineSchemasInFileListAndWriteToFile(
  fileList,
  platform != null ? platform.toLowerCase() : platform,
  outfile,
  excludeRegExp,
);
