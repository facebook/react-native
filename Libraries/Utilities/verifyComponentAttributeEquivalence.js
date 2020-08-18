/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const getNativeComponentAttributes = require('../ReactNative/getNativeComponentAttributes');

import ReactNativeViewViewConfig from '../Components/View/ReactNativeViewViewConfig';
import type {ReactNativeBaseComponentViewConfig} from '../Renderer/shims/ReactNativeTypes';

const IGNORED_KEYS = ['transform', 'hitSlop'];
/**
 * The purpose of this function is to validate that the view config that
 * native exposes for a given view manager is the same as the view config
 * that is specified for that view manager in JS.
 *
 * In order to improve perf, we want to avoid calling into native to get
 * the view config when each view manager is used. To do this, we are moving
 * the configs to JS. In the future we will use these JS based view configs
 * to codegen the view manager on native to ensure they stay in sync without
 * this runtime check.
 *
 * If this function fails, that likely means a change was made to the native
 * view manager without updating the JS config as well. Ideally you can make
 * that direct change to the JS config. If you don't know what the differences
 * are, the best approach I've found is to create a view that prints
 * the return value of getNativeComponentAttributes, and then copying that
 * text and pasting it back into JS:
 * <Text selectable={true}>{JSON.stringify(getNativeComponentAttributes('RCTView'))}</Text>
 *
 * This is meant to be a stopgap until the time comes when we only have a
 * single source of truth. I wonder if this message will still be here two
 * years from now...
 */
function verifyComponentAttributeEquivalence(
  componentName: string,
  config: ReactNativeBaseComponentViewConfig<>,
) {
  if (!global.RN$Bridgeless) {
    const nativeAttributes = getNativeComponentAttributes(componentName);

    ['validAttributes', 'bubblingEventTypes', 'directEventTypes'].forEach(
      prop => {
        const diffKeys = Object.keys(
          lefthandObjectDiff(nativeAttributes[prop], config[prop]),
        );

        if (diffKeys.length) {
          console.error(
            `${componentName} generated view config for ${prop} does not match native, missing: ${diffKeys.join(
              ' ',
            )}`,
          );
        }
      },
    );
  }
}

export function lefthandObjectDiff(leftObj: Object, rightObj: Object): Object {
  const differentKeys = {};

  function compare(leftItem, rightItem, key) {
    if (typeof leftItem !== typeof rightItem && leftItem != null) {
      differentKeys[key] = rightItem;
      return;
    }

    if (typeof leftItem === 'object') {
      const objDiff = lefthandObjectDiff(leftItem, rightItem);
      if (Object.keys(objDiff).length > 1) {
        differentKeys[key] = objDiff;
      }
      return;
    }

    if (leftItem !== rightItem) {
      differentKeys[key] = rightItem;
      return;
    }
  }

  for (const key in leftObj) {
    if (IGNORED_KEYS.includes(key)) {
      continue;
    }

    if (!rightObj) {
      differentKeys[key] = {};
    } else if (leftObj.hasOwnProperty(key)) {
      compare(leftObj[key], rightObj[key], key);
    }
  }

  return differentKeys;
}

export function getConfigWithoutViewProps(
  viewConfig: ReactNativeBaseComponentViewConfig<>,
  propName: string,
): {...} {
  if (!viewConfig[propName]) {
    return {};
  }

  return Object.keys(viewConfig[propName])
    .filter(prop => !ReactNativeViewViewConfig[propName][prop])
    .reduce((obj, prop) => {
      obj[prop] = viewConfig[propName][prop];
      return obj;
    }, {});
}

export function stringifyViewConfig(viewConfig: any): string {
  return JSON.stringify(
    viewConfig,
    (key, val) => {
      if (typeof val === 'function') {
        return `ƒ ${val.name}`;
      }
      return val;
    },
    2,
  );
}

export default verifyComponentAttributeEquivalence;
