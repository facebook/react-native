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
var verifyPropTypes = require('verifyPropTypes');

/**
 * Used to create React components that directly wrap native component
 * implementations.  Config information is extracted from data exported from the
 * RCTUIManager module.  You should also wrap the native component in a
 * hand-written component with full propTypes definitions and other
 * documentation - pass the hand-written component in as `wrapperComponent` to
 * verify all the native props are documented via `propTypes`.
 *
 * If some native props shouldn't be exposed in the wrapper interface, you can
 * pass null for `wrapperComponent` and call `verifyPropTypes` directly
 * with `nativePropsToIgnore`;
 *
 * Common types are lined up with the appropriate prop differs with
 * `TypeToDifferMap`.  Non-scalar types not in the map default to `deepDiffer`.
 */
function requireNativeComponent(
  viewName: string,
  wrapperComponent: ?Function
): Function {
  var viewConfig = RCTUIManager[viewName];
  if (!viewConfig || !viewConfig.nativeProps) {
    return UnimplementedView;
  }
  var nativeProps = {
    ...RCTUIManager.RCTView.nativeProps,
    ...viewConfig.nativeProps,
  };
  viewConfig.uiViewClassName = viewName;
  viewConfig.validAttributes = {};
  for (var key in nativeProps) {
    // TODO: deep diff by default in diffRawProperties instead of setting it here
    var differ = TypeToDifferMap[nativeProps[key]] || deepDiffer;
    viewConfig.validAttributes[key] = {diff: differ};
  }
  if (__DEV__) {
    wrapperComponent && verifyPropTypes(wrapperComponent, viewConfig);
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
