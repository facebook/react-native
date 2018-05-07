/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const Platform = require('Platform');
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
    // This is supported on UIManager platforms (ex: Android),
    // as lazy view managers are not implemented for all platforms.
    // See [UIManager] for details on constants and implementations.
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
      viewConfig != null && viewConfig.NativeProps != null,
      'Native component for "%s" does not exist',
      viewName,
    );

    viewConfig.uiViewClassName = viewName;
    viewConfig.validAttributes = {};
    viewConfig.propTypes =
      componentInterface == null ? null : componentInterface.propTypes;

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
      const typeName = nativeProps[key];
      const diff = getDifferForType(typeName);
      const process = getProcessorForType(typeName);

      viewConfig.validAttributes[key] =
        diff == null && process == null ? true : {diff, process};
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

    return viewConfig;
  }

  return createReactNativeComponentClass(viewName, getViewConfig);
}

function getDifferForType(
  typeName: string,
): ?(prevProp: any, nextProp: any) => boolean {
  switch (typeName) {
    // iOS Types
    case 'CATransform3D':
      return matricesDiffer;
    case 'CGPoint':
      return pointsDiffer;
    case 'CGSize':
      return sizesDiffer;
    case 'UIEdgeInsets':
      return insetsDiffer;
    // Android Types
    // (not yet implemented)
  }
  return null;
}

function getProcessorForType(typeName: string): ?(nextProp: any) => any {
  switch (typeName) {
    // iOS Types
    case 'CGColor':
    case 'UIColor':
      return processColor;
    case 'CGColorArray':
    case 'UIColorArray':
      return processColorArray;
    case 'CGImage':
    case 'UIImage':
    case 'RCTImageSource':
      return resolveAssetSource;
    // Android Types
    case 'Color':
      return processColor;
    case 'ColorArray':
      return processColorArray;
  }
  return null;
}

function processColorArray(colors: ?Array<any>): ?Array<?number> {
  return colors == null ? null : colors.map(processColor);
}

module.exports = requireNativeComponent;
