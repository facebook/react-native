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
var UnimplementedView = require('UnimplementedView');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var deepDiffer = require('deepDiffer');
var insetsDiffer = require('insetsDiffer');
var pointsDiffer = require('pointsDiffer');
var matricesDiffer = require('matricesDiffer');
var sizesDiffer = require('sizesDiffer');

/**
 * Used to create React components that directly wrap native component
 * implementations.  Config information is extracted from data exported from the
 * RCTUIManager module.  It is still strongly preferred that you wrap the native
 * component in a hand-written component with full propTypes definitions and
 * other documentation.
 *
 * Common types are lined up with the appropriate prop differs with
 * `TypeToDifferMap`.  Non-scalar types not in the map default to `deepDiffer`.
 */
function requireNativeComponent(viewName: string): Function {
  var viewConfig = RCTUIManager.viewConfigs && RCTUIManager.viewConfigs[viewName];
  if (!viewConfig) {
    return UnimplementedView;
  }
  var nativeProps = {
    ...RCTUIManager.viewConfigs.RCTView.nativeProps,
    ...viewConfig.nativeProps,
  };
  viewConfig.validAttributes = {};
  for (var key in nativeProps) {
    // TODO: deep diff by default in diffRawProperties instead of setting it here
    var differ = TypeToDifferMap[nativeProps[key].type] || deepDiffer;
    viewConfig.validAttributes[key] = {diff: differ};
  }
  return createReactIOSNativeComponentClass(viewConfig);
}

var TypeToDifferMap = {
  // iOS Types
  CATransform3D: matricesDiffer,
  CGPoint: pointsDiffer,
  CGSize: sizesDiffer,
  UIEdgeInsets: insetsDiffer,
  // Android Types
  // (not yet implemented)
};

module.exports = requireNativeComponent;
