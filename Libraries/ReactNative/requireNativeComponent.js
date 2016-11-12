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

const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const UIManager = require('UIManager');
const UnimplementedView = require('UnimplementedView');

const createReactNativeComponentClass = require('createReactNativeComponentClass');
const insetsDiffer = require('insetsDiffer');
const matricesDiffer = require('matricesDiffer');
const pointsDiffer = require('pointsDiffer');
const processColor = require('processColor');
const resolveAssetSource = require('resolveAssetSource');
const sizesDiffer = require('sizesDiffer');
const verifyPropTypes = require('verifyPropTypes');
const warning = require('fbjs/lib/warning');

/**
 * Used to create React components that directly wrap native component
 * implementations.  Config information is extracted from data exported from the
 * UIManager module.  You should also wrap the native component in a
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
  const viewConfig = UIManager[viewName];
  if (!viewConfig || !viewConfig.NativeProps) {
    warning(false, 'Native component for "%s" does not exist', viewName);
    return UnimplementedView;
  }

  viewConfig.uiViewClassName = viewName;
  viewConfig.validAttributes = {};
  viewConfig.propTypes = componentInterface && componentInterface.propTypes;

  // The ViewConfig doesn't contain any props inherited from the view manager's
  // superclass, so we manually merge in the RCTView ones. Other inheritance
  // patterns are currenty not supported.
  const nativeProps = {
    ...UIManager.RCTView.NativeProps,
    ...viewConfig.NativeProps,
  };
  for (const key in nativeProps) {
    let useAttribute = false;
    const attribute = {};

    const differ = TypeToDifferMap[nativeProps[key]];
    if (differ) {
      attribute.diff = differ;
      useAttribute = true;
    }

    const processor = TypeToProcessorMap[nativeProps[key]];
    if (processor) {
      attribute.process = processor;
      useAttribute = true;
    }

    viewConfig.validAttributes[key] = useAttribute ? attribute : true;
  }

  // Unfortunately, the current set up puts the style properties on the top
  // level props object. We also need to add the nested form for API
  // compatibility. This allows these props on both the top level and the
  // nested style level. TODO: Move these to nested declarations on the
  // native side.
  viewConfig.validAttributes.style = ReactNativeStyleAttributes;

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

function processColorArray(colors: []): [] {
  return colors && colors.map(processColor);
}

var TypeToProcessorMap = {
  // iOS Types
  CGColor: processColor,
  CGColorArray: processColorArray,
  UIColor: processColor,
  UIColorArray: processColorArray,
  CGImage: resolveAssetSource,
  UIImage: resolveAssetSource,
  RCTImageSource: resolveAssetSource,
  // Android Types
  Color: processColor,
  ColorArray: processColorArray,
};

module.exports = requireNativeComponent;
