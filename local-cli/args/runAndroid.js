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
    command: 'install-debug',
    type: 'string',
    required: false,
  }, {
    command: 'root',
    type: 'string',
    description: 'Override the root directory for the android build (which contains the android directory)',
  }, {
    command: 'flavor',
    type: 'string',
    required: false,
  }, {
    command: 'variant',
    type: 'string',
    required: false,
  }
];
