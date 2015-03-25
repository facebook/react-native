/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactIOSGlobalResponderHandler
 * @flow
 */
'use strict';

var RCTUIManager = require('NativeModules').UIManager;
var ReactIOSTagHandles = require('ReactIOSTagHandles');

var ReactIOSGlobalResponderHandler = {
  onChange: function(from: string, to: string) {
    if (to !== null) {
      RCTUIManager.setJSResponder(
        ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(to)
      );
    } else {
      RCTUIManager.clearJSResponder();
    }
  }
};

module.exports = ReactIOSGlobalResponderHandler;
