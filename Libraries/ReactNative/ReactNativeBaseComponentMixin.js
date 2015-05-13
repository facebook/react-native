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
   * This has no particular meaning in ReactNative. If this were in the DOM, this
   * would return the DOM node. There should be nothing that invokes this
   * method. Any current callers of this are mistaken - they should be invoking
   * `getNodeHandle`.
   */
  getNativeNode: function() {
    return findNodeHandle(this);
  },

  getNodeHandle: function() {
    return findNodeHandle(this);
  }
};

module.exports = ReactNativeComponentMixin;
