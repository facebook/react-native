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

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import flattenStyle from '../../StyleSheet/flattenStyle';
import Platform from '../../Utilities/Platform';
import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';
import AnimatedObject, {hasAnimatedNode} from './AnimatedObject';
import AnimatedTransform from './AnimatedTransform';
import AnimatedWithChildren from './AnimatedWithChildren';

function createAnimatedStyle(
  inputStyle: any,
  keepUnanimatedValues: boolean,
): Object {
  // $FlowFixMe[underconstrained-implicit-instantiation]
  const style = flattenStyle(inputStyle);
  const animatedStyles: any = {};
  for (const key in style) {
    const value = style[key];
    if (value != null && key === 'transform') {
      animatedStyles[key] =
        ReactNativeFeatureFlags.shouldUseAnimatedObjectForTransform()
          ? new AnimatedObject(value)
          : new AnimatedTransform(value);
    } else if (value instanceof AnimatedNode) {
      animatedStyles[key] = value;
    } else if (hasAnimatedNode(value)) {
      animatedStyles[key] = new AnimatedObject(value);
    } else if (keepUnanimatedValues) {
      animatedStyles[key] = value;
    }
  }
  return animatedStyles;
}

export default class AnimatedStyle extends AnimatedWithChildren {
  _inputStyle: any;
  _style: Object;

  constructor(style: any) {
    super();
    this._inputStyle = style;
    this._style = createAnimatedStyle(style, Platform.OS !== 'web');
  }

  __getValue(): Object | Array<Object> {
    const result: {[string]: any} = {};
    for (const key in this._style) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        result[key] = value.__getValue();
      } else {
        result[key] = value;
      }
    }

    return Platform.OS === 'web' ? [this._inputStyle, result] : result;
  }

  __getAnimatedValue(): Object {
    const result: {[string]: any} = {};
    for (const key in this._style) {
      const value = this._style[key];
      if (value instanceof AnimatedNode) {
        result[key] = value.__getAnimatedValue();
      }
    }
    return result;
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
