/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = [
  {
    command: 'entry-file',
    description: 'Path to the root JS file, either absolute or relative to JS root',
    type: 'string',
    required: true,
  }, {
    command: 'platform',
    description: 'Either "ios" or "android"',
    type: 'string',
    required: true,
  }, {
    command: 'transformer',
    description: 'Specify a custom transformer to be used (absolute path)',
    type: 'string',
    default: require.resolve('../../../packager/transformer'),
  }, {
    command: 'dev',
    description: 'If false, warnings are disabled and the bundle is minified',
    default: true,
  }, {
    command: 'bundle-output',
    description: 'File name where to store the resulting bundle, ex. /tmp/groups.bundle',
    type: 'string',
    required: true,
  }, {
    command: 'sourcemap-output',
    description: 'File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map',
    type: 'string',
  }, {
    command: 'assets-dest',
    description: 'Directory name where to store assets referenced in the bundle',
    type: 'string',
  }, {
    command: 'verbose',
    description: 'Enables logging',
    default: false,
  }
];
