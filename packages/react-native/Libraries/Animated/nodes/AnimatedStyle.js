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

import flattenStyle from '../../StyleSheet/flattenStyle';
import Platform from '../../Utilities/Platform';
import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';
import AnimatedTransform from './AnimatedTransform';
import AnimatedWithChildren from './AnimatedWithChildren';

function createAnimatedStyle(inputStyle: any): Object {
  // $FlowFixMe[underconstrained-implicit-instantiation]
  const style = flattenStyle(inputStyle);
  const animatedStyles: any = {};
  for (const key in style) {
    const value = style[key];
    if (key === 'transform') {
      animatedStyles[key] = new AnimatedTransform(value);
    } else if (value instanceof AnimatedNode) {
      animatedStyles[key] = value;
    } else if (value && !Array.isArray(value) && typeof value === 'object') {
      animatedStyles[key] = createAnimatedStyle(value);
    }
  }
  return animatedStyles;
}

function createStyleWithAnimatedTransform(inputStyle: any): Object {
  // $FlowFixMe[underconstrained-implicit-instantiation]
  let style = flattenStyle(inputStyle) || ({}: {[string]: any});

  if (style.transform) {
    style = {
      ...style,
      transform: new AnimatedTransform(style.transform),
    };
  }
  return style;
}

export default class AnimatedStyle extends AnimatedWithChildren {
  _inputStyle: any;
  _style: Object;

  constructor(style: any) {
    super();
    if (Platform.OS === 'web') {
      this._inputStyle = style;
      this._style = createAnimatedStyle(style);
    } else {
      this._style = createStyleWithAnimatedTransform(style);
    }
  }

  // Recursively get values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetValues(style: any): {[string]: any | {...}} {
    const updatedStyle: {[string]: any | {...}} = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof AnimatedNode) {
        updatedStyle[key] = value.__getValue();
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this._walkStyleAndGetValues(value);
      } else {
        updatedStyle[key] = value;
      }
    }
    return updatedStyle;
  }

  __getValue(): Object | Array<Object> {
    if (Platform.OS === 'web') {
      return [this._inputStyle, this._walkStyleAndGetValues(this._style)];
    }

    return this._walkStyleAndGetValues(this._style);
  }

  // Recursively get animated values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetAnimatedValues(style: any): {[string]: any | {...}} {
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
