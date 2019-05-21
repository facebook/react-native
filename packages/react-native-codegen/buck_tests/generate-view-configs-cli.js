/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const generate = require('./generate-view-configs');
const yargs = require('yargs');

const yargv = yargs.strict().option('t', {
  alias: 'test',
  describe: 'Test the changes and do not write files',
  requiresArg: false,
  type: 'boolean',
});

const argv = yargv.argv;
const fileList = argv._[0].split('\n');

const CURRENT_VIEW_CONFIG_SCHEMAS = [''];

generate(
  fileList.filter(fileName =>
    CURRENT_VIEW_CONFIG_SCHEMAS.find(supportedFileName =>
      fileName.endsWith(supportedFileName),
    ),
  ),
  // $FlowFixMe Type argv
  argv.test,
);
