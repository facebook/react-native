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
 * @format
 */
'use strict';

const Platform = require('Platform');
const ReactNativeBridgeEventPlugin = require('ReactNativeBridgeEventPlugin');
const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const UIManager = require('UIManager');

const createReactNativeComponentClass = require('createReactNativeComponentClass');
const insetsDiffer = require('insetsDiffer');
const matricesDiffer = require('matricesDiffer');
const pointsDiffer = require('pointsDiffer');
const processColor = require('processColor');
const resolveAssetSource = require('resolveAssetSource');
const sizesDiffer = require('sizesDiffer');
const verifyPropTypes = require('verifyPropTypes');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const invariant = require('fbjs/lib/invariant');
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
import type {ComponentInterface} from 'verifyPropTypes';

let hasAttachedDefaultEventTypes: boolean = false;

function requireNativeComponent(
  viewName: string,
  componentInterface?: ?ComponentInterface,
  extraConfig?: ?{nativeOnly?: Object},
): React$ComponentType<any> | string {
  function attachDefaultEventTypes(viewConfig: any) {
    if (Platform.OS === 'android') {
      // This is supported on Android platform only,
      // as lazy view managers discovery is Android-specific.
      if (UIManager.ViewManagerNames) {
        // Lazy view managers enabled.
        viewConfig = merge(viewConfig, UIManager.getDefaultEventTypes());
      } else {
        viewConfig.bubblingEventTypes = merge(
          viewConfig.bubblingEventTypes,
          UIManager.genericBubblingEventTypes,
        );
        viewConfig.directEventTypes = merge(
          viewConfig.directEventTypes,
          UIManager.genericDirectEventTypes,
        );
      }
    }
  }

  function merge(destination: ?Object, source: ?Object): ?Object {
    if (!source) {
      return destination;
    }
    if (!destination) {
      return source;
    }

    for (const key in source) {
      if (!source.hasOwnProperty(key)) {
        continue;
      }

      var sourceValue = source[key];
      if (destination.hasOwnProperty(key)) {
        const destinationValue = destination[key];
        if (
          typeof sourceValue === 'object' &&
          typeof destinationValue === 'object'
        ) {
          sourceValue = merge(destinationValue, sourceValue);
        }
      }
      destination[key] = sourceValue;
    }
    return destination;
  }

  // Don't load the ViewConfig from UIManager until it's needed for rendering.
  // Lazy-loading this can help avoid Prepack deopts.
  function getViewConfig() {
    const viewConfig = UIManager[viewName];

    invariant(
      viewConfig != null && !viewConfig.NativeProps != null,
      'Native component for "%s" does not exist',
      viewName,
    );

    viewConfig.uiViewClassName = viewName;
    viewConfig.validAttributes = {};

    // ReactNative `View.propTypes` have been deprecated in favor of
    // `ViewPropTypes`. In their place a temporary getter has been added with a
    // deprecated warning message. Avoid triggering that warning here by using
    // temporary workaround, __propTypesSecretDontUseThesePlease.
    // TODO (bvaughn) Revert this particular change any time after April 1
    if (componentInterface) {
      viewConfig.propTypes =
        typeof componentInterface.__propTypesSecretDontUseThesePlease ===
        'object'
          ? componentInterface.__propTypesSecretDontUseThesePlease
          : componentInterface.propTypes;
    } else {
      viewConfig.propTypes = null;
    }

    let baseModuleName = viewConfig.baseModuleName;
    let bubblingEventTypes = viewConfig.bubblingEventTypes;
    let directEventTypes = viewConfig.directEventTypes;
    let nativeProps = viewConfig.NativeProps;
    while (baseModuleName) {
      const baseModule = UIManager[baseModuleName];
      if (!baseModule) {
        warning(false, 'Base module "%s" does not exist', baseModuleName);
        baseModuleName = null;
      } else {
        bubblingEventTypes = {
          ...baseModule.bubblingEventTypes,
          ...bubblingEventTypes,
        };
        directEventTypes = {
          ...baseModule.directEventTypes,
          ...directEventTypes,
        };
        nativeProps = {
          ...baseModule.NativeProps,
          ...nativeProps,
        };
        baseModuleName = baseModule.baseModuleName;
      }
    }

    viewConfig.bubblingEventTypes = bubblingEventTypes;
    viewConfig.directEventTypes = directEventTypes;

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
      componentInterface &&
        verifyPropTypes(
          componentInterface,
          viewConfig,
          extraConfig && extraConfig.nativeOnly,
        );
    }

    if (!hasAttachedDefaultEventTypes) {
      attachDefaultEventTypes(viewConfig);
      hasAttachedDefaultEventTypes = true;
    }

    // Register this view's event types with the ReactNative renderer.
    // This enables view managers to be initialized lazily, improving perf,
    // While also enabling 3rd party components to define custom event types.
    ReactNativeBridgeEventPlugin.processEventTypes(viewConfig);

    return viewConfig;
  }

  return createReactNativeComponentClass(viewName, getViewConfig);
}

const TypeToDifferMap = {
  // iOS Types
  CATransform3D: matricesDiffer,
  CGPoint: pointsDiffer,
  CGSize: sizesDiffer,
  UIEdgeInsets: insetsDiffer,
  // Android Types
  // (not yet implemented)
};

function processColorArray(colors: ?Array<any>): ?Array<?number> {
  return colors && colors.map(processColor);
}

const TypeToProcessorMap = {
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
