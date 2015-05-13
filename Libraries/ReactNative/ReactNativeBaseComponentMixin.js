/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeComponentMixin
 * @flow
 */
'use strict';

var findNodeHandle = require('findNodeHandle');

var ReactNativeComponentMixin = {
  /**
   * This method is deprecated; use `React.findNodeHandle` instead.
   */
  getNativeNode: function() {
    return findNodeHandle(this);
  },

  /**
   * This method is deprecated; use `React.findNodeHandle` instead.
   */
  getNodeHandle: function() {
    return findNodeHandle(this);
  }
};

module.exports = ReactNativeComponentMixin;
