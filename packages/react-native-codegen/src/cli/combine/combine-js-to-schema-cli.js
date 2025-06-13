/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  combineSchemasInFileListAndWriteToFile,
} = require('./combine-js-to-schema');
const yargs = require('yargs');

const argv = yargs
  .usage('Usage: $0 <outfile> <file1> [<file2> ...]')
  .option('p', {
    describe:
      'Platforms to generate schema for, this works on filenames: <filename>[.<platform>].(js|tsx?)',
    alias: 'platform',
    default: null,
  })
  .option('e', {
    describe: 'Regular expression to exclude files from schema generation',
    alias: 'exclude',
    default: null,
  })
  .option('exclude-interface-only', {
    describe: 'Exclude components with interfaceOnly: true',
    type: 'boolean',
    default: false,
  })
  .option('exclude-unimplemented', {
    describe:
      'Exclude component named UnimplementedNativeViewNativeComponent.js',
    type: 'boolean',
    default: false,
  })
  .parseSync();

const [outfile, ...fileList] = argv._;
const platform: ?string = argv.platform;
const exclude: string = argv.exclude;
const excludeRegExp: ?RegExp =
  exclude != null && exclude !== '' ? new RegExp(exclude) : null;
const excludeInterfaceOnly: boolean = argv['exclude-interface-only'];
const excludeUnimplemented: boolean = argv['exclude-unimplemented'];

combineSchemasInFileListAndWriteToFile(
  fileList,
  platform != null ? platform.toLowerCase() : platform,
  outfile,
  excludeRegExp,
  excludeInterfaceOnly,
  excludeUnimplemented,
);
