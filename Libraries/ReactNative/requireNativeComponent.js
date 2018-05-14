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

type ComponentInterface =
  | React$ComponentType<any>
  | $ReadOnly<{
      propTypes?: $ReadOnly<{
        [propName: string]: mixed,
      }>,
    }>;

type ExtraOptions = $ReadOnly<{|
  nativeOnly?: $ReadOnly<{
    [propName: string]: boolean,
  }>,
|}>;

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
const requireNativeComponent = (
  viewName: string,
  componentInterface?: ?ComponentInterface,
  extraConfig?: ?ExtraOptions,
): string =>
  createReactNativeComponentClass(viewName, () => {
    const viewConfig = UIManager[viewName];

    invariant(
      viewConfig != null && viewConfig.NativeProps != null,
      'requireNativeComponent: "%s" was not found in the UIManager.',
      viewName,
    );

    // TODO: This seems like a whole lot of runtime initialization for every
    // native component that can be either avoided or simplified.
    let {baseModuleName, bubblingEventTypes, directEventTypes} = viewConfig;
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

    const viewAttributes = {};

    for (const key in nativeProps) {
      const typeName = nativeProps[key];
      const diff = getDifferForType(typeName);
      const process = getProcessorForType(typeName);

      viewAttributes[key] =
        diff == null && process == null ? true : {diff, process};
    }

    // Unfortunately, the current setup declares style properties as top-level
    // props. This makes it so we allow style properties in the `style` prop.
    // TODO: Move style properties into a `style` prop and disallow them as
    // top-level props on the native side.
    viewAttributes.style = ReactNativeStyleAttributes;

    Object.assign(viewConfig, {
      uiViewClassName: viewName,
      validAttributes: viewAttributes,
      propTypes:
        componentInterface == null ? null : componentInterface.propTypes,
      bubblingEventTypes,
      directEventTypes,
    });

    if (__DEV__) {
      verifyPropTypes(
        viewConfig,
        extraConfig == null ? null : extraConfig.nativeOnly,
      );
    }

    if (!hasAttachedDefaultEventTypes) {
      attachDefaultEventTypes(viewConfig);
      hasAttachedDefaultEventTypes = true;
    }

    return viewConfig;
  });

// TODO: Figure out how this makes sense. We're using a global boolean to only
// initialize this on the first eagerly initialized native component.
let hasAttachedDefaultEventTypes = false;
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

// TODO: Figure out how to avoid all this runtime initialization cost.
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

    let sourceValue = source[key];
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
