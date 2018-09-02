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
const {createOrReuseTransformNode} = require('./AnimatedTransform');
const AnimatedWithChildren = require('./AnimatedWithChildren');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');

const areEqual = require('fbjs/lib/areEqual');
const flattenStyle = require('flattenStyle');

function createNativeConfig(inputStyle) {
  const styleConfig = {};
  for (const styleKey in inputStyle) {
    if (
      inputStyle[styleKey] instanceof AnimatedNode &&
      inputStyle[styleKey].__isNative
    ) {
      styleConfig[styleKey] = inputStyle[styleKey].__getNativeTag();
    }
    // Non-animated styles are set using `setNativeProps`, no need
    // to pass those as a part of the node config
  }
  return styleConfig;
}

function createOrReuseStyleNode(style: any, oldNode: ?AnimatedStyle) {
  style = flattenStyle(style) || {};
  if (style.transform) {
    style = {
      ...style,
      transform: createOrReuseTransformNode(
        style.transform,
        oldNode && oldNode._style.transform,
      ),
    };
  }

  if (oldNode && oldNode.__isNative) {
    const config = createNativeConfig(style);
    if (areEqual(config, oldNode._nativeConfig)) {
      return oldNode;
    }
  }
  return new AnimatedStyle(style);
}

/**
 * AnimatedStyle should never be directly instantiated, use createOrReuseStyleNode
 * in order to make a new instance of this node.
 */
class AnimatedStyle extends AnimatedWithChildren {
  _style: Object;
  _nativeConfig: ?Object;

  constructor(style: any) {
    super();

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
    if (this._nativeConfig == null) {
      this._nativeConfig = createNativeConfig(this._style);
    }

    NativeAnimatedHelper.validateStyles(this._nativeConfig);

    return {
      type: 'style',
      style: this._nativeConfig,
    };
  }
}

module.exports = {createOrReuseStyleNode, AnimatedStyle};
