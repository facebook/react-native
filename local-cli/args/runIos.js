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
    command: 'simulator',
    description: 'Explicitly set simulator to use',
    type: 'string',
    required: false,
    default: 'iPhone 6',
  }, {
    command: 'scheme',
    description: 'Explicitly set Xcode scheme to use',
    type: 'string',
    required: false,
  }, {
    command: 'project-path',
    description: 'Path relative to project root where the Xcode project (.xcodeproj) lives. The default is \'ios\'.',
    type: 'string',
    required: false,
    default: 'ios',
  }
];
