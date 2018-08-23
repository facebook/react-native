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

const AnimatedNode = require('./AnimatedNode');
const AnimatedTransform = require('./AnimatedTransform');
const AnimatedWithChildren = require('./AnimatedWithChildren');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');

const flattenStyle = require('flattenStyle');

class AnimatedStyle extends AnimatedWithChildren {
  _style: Object;

  constructor(style: any) {
    super();
    style = flattenStyle(style) || {};
    if (style.transform) {
      style = {
        ...style,
        transform: new AnimatedTransform(style.transform),
      };
    }
    this._style = style;
  }

  // Recursively get values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetValues(style) {
    const updatedStyle = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof AnimatedNode) {
        if (!value.__isNative) {
          // We cannot use value of natively driven nodes this way as the value we have access from
          // JS may not be up to date.
          updatedStyle[key] = value.__getValue();
        }
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this._walkStyleAndGetValues(value);
      } else {
        updatedStyle[key] = value;
      }
    }
    return updatedStyle;
  }

  __getValue(): Object {
    return this._walkStyleAndGetValues(this._style);
  }

  // Recursively get animated values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetAnimatedValues(style) {
    const updatedStyle = {};
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

  __makeNative() {
    for (const key in this._style) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        value.__makeNative();
      }
    }
    super.__makeNative();
  }

  __getNativeConfig(): Object {
    const styleConfig = {};
    for (const styleKey in this._style) {
      if (this._style[styleKey] instanceof AnimatedNode) {
        styleConfig[styleKey] = this._style[styleKey].__getNativeTag();
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
