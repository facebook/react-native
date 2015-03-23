/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var HasteDependencyResolver = require('./haste');
var NodeDependencyResolver = require('./node');

module.exports = function createDependencyResolver(options) {
  if (options.moduleFormat === 'haste') {
    return new HasteDependencyResolver(options);
  } else if (options.moduleFormat === 'node') {
    return new NodeDependencyResolver(options);
  } else {
    throw new Error('unsupported');
  }
};
