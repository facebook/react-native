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

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var insetsDiffer = require('insetsDiffer');
var pointsDiffer = require('pointsDiffer');
var matricesDiffer = require('matricesDiffer');
var sizesDiffer = require('sizesDiffer');
var verifyPropTypes = require('verifyPropTypes');
var warning = require('warning');

/**
 * Used to create React components that directly wrap native component
 * implementations.  Config information is extracted from data exported from the
 * RCTUIManager module.  You should also wrap the native component in a
 * hand-written component with full propTypes definitions and other
 * documentation - pass the hand-written component in as `componentInterface` to
 * verify all the native props are documented via `propTypes`.
 *
 * If some native props shouldn't be exposed in the wrapper interface, you can
 * pass null for `componentInterface` and call `verifyPropTypes` directly
 * with `nativePropsToIgnore`;
 *
 * Common types are lined up with the appropriate prop differs with
 * `TypeToDifferMap`.  Non-scalar types not in the map default to `deepDiffer`.
 */
import type { ComponentInterface } from 'verifyPropTypes';

function requireNativeComponent(
  viewName: string,
  componentInterface?: ?ComponentInterface,
  extraConfig?: ?{nativeOnly?: Object},
): Function {
  var viewConfig = RCTUIManager[viewName];
  if (!viewConfig || !viewConfig.NativeProps) {
    warning(false, 'Native component for "%s" does not exist', viewName);
    return UnimplementedView;
  }
  var nativeProps = {
    ...RCTUIManager.RCTView.NativeProps,
    ...viewConfig.NativeProps,
  };
  viewConfig.uiViewClassName = viewName;
  viewConfig.validAttributes = {};
  viewConfig.propTypes = componentInterface && componentInterface.propTypes;
  for (var key in nativeProps) {
    var differ = TypeToDifferMap[nativeProps[key]];
    viewConfig.validAttributes[key] = differ ? {diff: differ} : true;
  }
  if (__DEV__) {
    componentInterface && verifyPropTypes(
      componentInterface,
      viewConfig,
      extraConfig && extraConfig.nativeOnly
    );
  }
  return createReactNativeComponentClass(viewConfig);
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
