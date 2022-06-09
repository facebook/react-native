/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {PlatformConfig} from '../AnimatedPlatformConfig';

const flattenStyle = require('../../StyleSheet/flattenStyle');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');
const AnimatedNode = require('./AnimatedNode');
const AnimatedTransform = require('./AnimatedTransform');
const AnimatedWithChildren = require('./AnimatedWithChildren');

class AnimatedStyle extends AnimatedWithChildren {
  _style: Object;

  constructor(style: any) {
    super();
    style = flattenStyle(style) || ({}: {[string]: any});
    if (style.transform) {
      style = {
        ...style,
        transform: new AnimatedTransform(style.transform),
      };
    }
    this._style = style;
  }

  // Recursively get values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetValues(style: any, initialStyle: ?Object) {
    const updatedStyle: {[string]: any | {...}} = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof AnimatedNode) {
        // During initial render we want to use the initial value of both natively and non-natively
        // driven nodes. On subsequent renders, we cannot use the value of natively driven nodes
        // as they may not be up to date, so we use the initial value to ensure that values of
        // native animated nodes do not impact rerenders.
        if (!initialStyle || !value.__isNative) {
          updatedStyle[key] = value.__getValue();
        } else if (initialStyle.hasOwnProperty(key)) {
          updatedStyle[key] = initialStyle[key];
        }
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this._walkStyleAndGetValues(value, initialStyle);
      } else {
        updatedStyle[key] = value;
      }
    }
    return updatedStyle;
  }

  __getValue(initialStyle: ?Object): Object {
    return this._walkStyleAndGetValues(this._style, initialStyle);
  }

  // Recursively get animated values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetAnimatedValues(style: any) {
    const updatedStyle: {[string]: any | {...}} = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof AnimatedNode) {
        updatedStyle[key] = value.__getAnimatedValue();
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this._walkStyleAndGetAnimatedValues(value);
      }
    }
    return updatedStyle;
  }

  __getAnimatedValue(): Object {
    return this._walkStyleAndGetAnimatedValues(this._style);
  }

  __attach(): void {
    for (const key in this._style) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (const key in this._style) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        value.__removeChild(this);
      }
    }
    super.__detach();
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    for (const key in this._style) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        value.__makeNative(platformConfig);
      }
    }
    super.__makeNative(platformConfig);
  }

  __getNativeConfig(): Object {
    const styleConfig: {[string]: ?number} = {};
    for (const styleKey in this._style) {
      if (this._style[styleKey] instanceof AnimatedNode) {
        const style = this._style[styleKey];
        style.__makeNative(this.__getPlatformConfig());
        styleConfig[styleKey] = style.__getNativeTag();
      }
      // Non-animated styles are set using `setNativeProps`, no need
      // to pass those as a part of the node config
    }
    NativeAnimatedHelper.validateStyles(styleConfig);
    return {
      type: 'style',
      style: styleConfig,
    };
  }
}

module.exports = AnimatedStyle;
