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
    command: 'port',
    default: 8081,
    type: 'string',
    description: 'Specify the port on which the packager runs.'
  }, {
    command: 'host',
    default: '',
    type: 'string',
    description: 'Set the hostname to be used by the packager'
  }, {
    command: 'root',
    type: 'string',
    description: 'Add another root(s) to be used by the packager in this project',
  }, {
    command: 'projectRoots',
    type: 'string',
    description: 'Override the root(s) to be used by the packager',
  },{
    command: 'assetRoots',
    type: 'string',
    description: 'Specify the root directories of app assets'
  }, {
    command: 'skipflow',
    description: 'Disable flow checks'
  }, {
    command: 'nonPersistent',
    description: 'Disable file watcher'
  }, {
    command: 'transformer',
    type: 'string',
    default: require.resolve('../../packager/transformer'),
    description: 'Specify a custom transformer to be used (absolute path)'
  }, {
    command: 'resetCache',
    description: 'Removes cached files',
    default: false,
  }, {
    command: 'reset-cache',
    description: 'Removes cached files',
    default: false,
  }, {
    command: 'verbose',
    description: 'Enables logging',
    default: false,
  }
];
