/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AnimatedTracking
 * @flow
 * @format
 */
'use strict';

const AnimatedValue = require('./AnimatedValue');
const AnimatedNode = require('./AnimatedNode');
const {
  generateNewAnimationId,
  shouldUseNativeDriver,
} = require('../NativeAnimatedHelper');

import type {EndCallback} from '../animations/Animation';

class AnimatedTracking extends AnimatedNode {
  _value: AnimatedValue;
  _parent: AnimatedNode;
  _callback: ?EndCallback;
  _animationConfig: Object;
  _animationClass: any;
  _useNativeDriver: boolean;

  constructor(
    value: AnimatedValue,
    parent: AnimatedNode,
    animationClass: any,
    animationConfig: Object,
    callback?: ?EndCallback,
  ) {
    super();
    this._value = value;
    this._parent = parent;
    this._animationClass = animationClass;
    this._animationConfig = animationConfig;
    this._useNativeDriver = shouldUseNativeDriver(animationConfig);
    this._callback = callback;
    this.__attach();
  }

  __makeNative() {
    this.__isNative = true;
    this._parent.__makeNative();
    super.__makeNative();
    this._value.__makeNative();
  }

  __getValue(): Object {
    return this._parent.__getValue();
  }

  __attach(): void {
    this._parent.__addChild(this);
    if (this._useNativeDriver) {
      // when the tracking starts we need to convert this node to a "native node"
      // so that the parent node will be made "native" too. This is necessary as
      // if we don't do this `update` method will get called. At that point it
      // may be too late as it would mean the JS driver has already started
      // updating node values
      this.__makeNative();
    }
  }

  __detach(): void {
    this._parent.__removeChild(this);
    super.__detach();
  }

  update(): void {
    this._value.animate(
      new this._animationClass({
        ...this._animationConfig,
        toValue: (this._animationConfig.toValue: any).__getValue(),
      }),
      this._callback,
    );
  }

  __getNativeConfig(): any {
    const animation = new this._animationClass({
      ...this._animationConfig,
      // remove toValue from the config as it's a ref to Animated.Value
      toValue: undefined,
    });
    const animationConfig = animation.__getNativeAnimationConfig();
    return {
      type: 'tracking',
      animationId: generateNewAnimationId(),
      animationConfig,
      toValue: this._parent.__getNativeTag(),
      value: this._value.__getNativeTag(),
    };
  }
}

module.exports = AnimatedTracking;
