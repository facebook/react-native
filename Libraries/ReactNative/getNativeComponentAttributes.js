/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const UIManager = require('UIManager');

const insetsDiffer = require('insetsDiffer');
const matricesDiffer = require('matricesDiffer');
const pointsDiffer = require('pointsDiffer');
const processColor = require('processColor');
const resolveAssetSource = require('resolveAssetSource');
const sizesDiffer = require('sizesDiffer');
const invariant = require('invariant');
const warning = require('fbjs/lib/warning');

function getNativeComponentAttributes(uiViewClassName: string) {
  const viewConfig = UIManager.getViewManagerConfig(uiViewClassName);

  invariant(
    viewConfig != null && viewConfig.NativeProps != null,
    'requireNativeComponent: "%s" was not found in the UIManager.',
    uiViewClassName,
  );

  // TODO: This seems like a whole lot of runtime initialization for every
  // native component that can be either avoided or simplified.
  let {baseModuleName, bubblingEventTypes, directEventTypes} = viewConfig;
  let nativeProps = viewConfig.NativeProps;
  while (baseModuleName) {
    const baseModule = UIManager.getViewManagerConfig(baseModuleName);
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

  const validAttributes = {};

  for (const key in nativeProps) {
    const typeName = nativeProps[key];
    const diff = getDifferForType(typeName);
    const process = getProcessorForType(typeName);

    validAttributes[key] =
      diff == null && process == null ? true : {diff, process};
  }

  // Unfortunately, the current setup declares style properties as top-level
  // props. This makes it so we allow style properties in the `style` prop.
  // TODO: Move style properties into a `style` prop and disallow them as
  // top-level props on the native side.
  validAttributes.style = ReactNativeStyleAttributes;

  Object.assign(viewConfig, {
    uiViewClassName,
    validAttributes,
    bubblingEventTypes,
    directEventTypes,
  });

  if (!hasAttachedDefaultEventTypes) {
    attachDefaultEventTypes(viewConfig);
    hasAttachedDefaultEventTypes = true;
  }

  return viewConfig;
}

// TODO: Figure out how this makes sense. We're using a global boolean to only
// initialize this on the first eagerly initialized native component.
let hasAttachedDefaultEventTypes = false;
function attachDefaultEventTypes(viewConfig: any) {
  // This is supported on UIManager platforms (ex: Android),
  // as lazy view managers are not implemented for all platforms.
  // See [UIManager] for details on constants and implementations.
  if (UIManager.ViewManagerNames || UIManager.LazyViewManagersEnabled) {
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

module.exports = getNativeComponentAttributes;
