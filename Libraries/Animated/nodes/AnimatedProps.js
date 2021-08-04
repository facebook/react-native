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

const {AnimatedEvent} = require('../AnimatedEvent');
const AnimatedNode = require('./AnimatedNode');
const AnimatedStyle = require('./AnimatedStyle');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');
const ReactNative = require('../../Renderer/shims/ReactNative');

const invariant = require('invariant');

class AnimatedProps extends AnimatedNode {
  _props: Object;
  _animatedView: any;
  _callback: () => void;

  constructor(props: Object, callback: () => void) {
    super();
    if (props.style) {
      props = {
        ...props,
        style: new AnimatedStyle(props.style),
      };
    }
    this._props = props;
    this._callback = callback;
  }

  __getValue(): Object {
    const props = {};
    for (const key in this._props) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        if (!value.__isNative || value instanceof AnimatedStyle) {
          // We cannot use value of natively driven nodes this way as the value we have access from
          // JS may not be up to date.
          props[key] = value.__getValue();
        }
      } else if (value instanceof AnimatedEvent) {
        props[key] = value.__getHandler();
      } else {
        props[key] = value;
      }
    }
    return props;
  }

  __getAnimatedValue(): Object {
    const props = {};
    for (const key in this._props) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        props[key] = value.__getAnimatedValue();
      }
    }
    return props;
  }

  __attach(): void {
    for (const key in this._props) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    if (this.__isNative && this._animatedView) {
      this.__disconnectAnimatedView();
    }
    for (const key in this._props) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        value.__removeChild(this);
      }
    }
    super.__detach();
  }

  update(): void {
    this._callback();
  }

  __makeNative(): void {
    if (!this.__isNative) {
      this.__isNative = true;
      for (const key in this._props) {
        const value = this._props[key];
        if (value instanceof AnimatedNode) {
          value.__makeNative();
        }
      }
      if (this._animatedView) {
        this.__connectAnimatedView();
      }
    }
  }

  setNativeView(animatedView: any): void {
    if (this._animatedView === animatedView) {
      return;
    }
    this._animatedView = animatedView;
    if (this.__isNative) {
      this.__connectAnimatedView();
    }
  }

  __connectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    const nativeViewTag: ?number = ReactNative.findNodeHandle(
      this._animatedView,
    );
    invariant(
      nativeViewTag != null,
      'Unable to locate attached view in the native tree',
    );
    NativeAnimatedHelper.API.connectAnimatedNodeToView(
      this.__getNativeTag(),
      nativeViewTag,
    );
  }

  __disconnectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    const nativeViewTag: ?number = ReactNative.findNodeHandle(
      this._animatedView,
    );
    invariant(
      nativeViewTag != null,
      'Unable to locate attached view in the native tree',
    );
    NativeAnimatedHelper.API.disconnectAnimatedNodeFromView(
      this.__getNativeTag(),
      nativeViewTag,
    );
  }

  __restoreDefaultValues(): void {
    // When using the native driver, view properties need to be restored to
    // their default values manually since react no longer tracks them. This
    // is needed to handle cases where a prop driven by native animated is removed
    // after having been changed natively by an animation.
    if (this.__isNative) {
      NativeAnimatedHelper.API.restoreDefaultValues(this.__getNativeTag());
    }
  }

  __getNativeConfig(): Object {
    const propsConfig = {};
    for (const propKey in this._props) {
      const value = this._props[propKey];
      if (value instanceof AnimatedNode) {
        value.__makeNative();
        propsConfig[propKey] = value.__getNativeTag();
      }
    }
    return {
      type: 'props',
      props: propsConfig,
    };
  }
}

module.exports = AnimatedProps;
