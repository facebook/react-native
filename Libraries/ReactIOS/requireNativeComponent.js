/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule requireNativeComponent
 * @flow
 */
'use strict';

var RCTUIManager = require('NativeModules').UIManager;

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');

function requireNativeComponent(viewName: string, customDiffers?: Object): Function {
  var viewConfig = RCTUIManager.viewConfigs[viewName];
  if (!viewConfig) {
    console.warn(
      'Native view `' + viewName + '` is not available.  Make sure the ' +
      'native module is properly built and included in your project.'
    );
    viewConfig = RCTUIManager.viewConfigs.RCTView;
  }
  viewConfig.validAttributes = {};
  for (var key in viewConfig.nativePropTypes) {
    var customDiffer = customDiffers && customDiffers[key];
    viewConfig.validAttributes[key] = customDiffer ? {diff: customDiffer} : true;
  }
  return createReactIOSNativeComponentClass(viewConfig);
}

module.exports = requireNativeComponent;
