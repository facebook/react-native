/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeGlobalResponderHandler
 * @flow
 */
'use strict';

var RCTUIManager = require('NativeModules').UIManager;
var ReactNativeTagHandles = require('ReactNativeTagHandles');

var ReactNativeGlobalResponderHandler = {
  onChange: function(from: string, to: string, blockNativeResponder: boolean) {
    if (to !== null) {
      RCTUIManager.setJSResponder(
        ReactNativeTagHandles.mostRecentMountedNodeHandleForRootNodeID(to),
        blockNativeResponder
      );
    } else {
      RCTUIManager.clearJSResponder();
    }
  }
};

module.exports = ReactNativeGlobalResponderHandler;
