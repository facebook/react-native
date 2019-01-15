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

const AnimatedInterpolation = require('./AnimatedInterpolation');
const AnimatedWithChildren = require('./AnimatedWithChildren');
const InteractionManager = require('InteractionManager');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');

import type Animation, {EndCallback} from '../animations/Animation';
import type {InterpolationConfigType} from './AnimatedInterpolation';
import type AnimatedTracking from './AnimatedTracking';

const NativeAnimatedAPI = NativeAnimatedHelper.API;

type ValueListenerCallback = (state: {value: number}) => void;

let _uniqueId = 1;

/**
 * Animated works by building a directed acyclic graph of dependencies
 * transparently when you render your Animated components.
 *
 *               new Animated.Value(0)
 *     .interpolate()        .interpolate()    new Animated.Value(1)
 *         opacity               translateY      scale
 *          style                         transform
 *         View#234                         style
 *                                         View#123
 *
 * A) Top Down phase
 * When an Animated.Value is updated, we recursively go down through this
 * graph in order to find leaf nodes: the views that we flag as needing
 * an update.
 *
 * B) Bottom Up phase
 * When a view is flagged as needing an update, we recursively go back up
 * in order to build the new value that it needs. The reason why we need
 * this two-phases process is to deal with composite props such as
 * transform which can receive values from multiple parents.
 */
function _flush(rootNode: AnimatedValue): void {
  const animatedStyles = new Set();
  function findAnimatedStyles(node) {
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    if (typeof node.update === 'function') {
      animatedStyles.add(node);
    } else {
      node.__getChildren().forEach(findAnimatedStyles);
    }
  }
  findAnimatedStyles(rootNode);
  /* $FlowFixMe */
  animatedStyles.forEach(animatedStyle => animatedStyle.update());
}

/**
 * Standard value for driving animations.  One `Animated.Value` can drive
 * multiple properties in a synchronized fashion, but can only be driven by one
 * mechanism at a time.  Using a new mechanism (e.g. starting a new animation,
 * or calling `setValue`) will stop any previous ones.
 *
 * See http://facebook.github.io/react-native/docs/animatedvalue.html
 */
class AnimatedValue extends AnimatedWithChildren {
  _value: number;
  _startingValue: number;
  _offset: number;
  _animation: ?Animation;
  _tracking: ?AnimatedTracking;
  _listeners: {[key: string]: ValueListenerCallback};
  __nativeAnimatedValueListener: ?any;

  constructor(value: number) {
    super();
    this._startingValue = this._value = value;
    this._offset = 0;
    this._animation = null;
    this._listeners = {};
  }

  __detach() {
    this.stopAnimation();
    super.__detach();
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  __makeNative() {
    super.__makeNative();

    if (Object.keys(this._listeners).length) {
      this._startListeningToNativeValueUpdates();
    }
  }

  /**
   * Directly set the value.  This will stop any animations running on the value
   * and update all the bound properties.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#setvalue
   */
  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(
      value,
      !this.__isNative /* don't perform a flush for natively driven values */,
    );
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value);
    }
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether via
   * `setValue`, an animation, or `Animated.event`.  Useful for compensating
   * things like the start of a pan gesture.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#setoffset
   */
  setOffset(offset: number): void {
    this._offset = offset;
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeOffset(this.__getNativeTag(), offset);
    }
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#flattenoffset
   */
  flattenOffset(): void {
    this._value += this._offset;
    this._offset = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.flattenAnimatedNodeOffset(this.__getNativeTag());
    }
  }

  /**
   * Sets the offset value to the base value, and resets the base value to zero.
   * The final output of the value is unchanged.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#extractoffset
   */
  extractOffset(): void {
    this._offset += this._value;
    this._value = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag());
    }
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to
   * synchronously read the value because it might be driven natively.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#addlistener
   */
  addListener(callback: ValueListenerCallback): string {
    const id = String(_uniqueId++);
    this._listeners[id] = callback;
    if (this.__isNative) {
      this._startListeningToNativeValueUpdates();
    }
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#removelistener
   */
  removeListener(id: string): void {
    delete this._listeners[id];
    if (this.__isNative && Object.keys(this._listeners).length === 0) {
      this._stopListeningForNativeValueUpdates();
    }
  }

  /**
   * Remove all registered listeners.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#removealllisteners
   */
  removeAllListeners(): void {
    this._listeners = {};
    if (this.__isNative) {
      this._stopListeningForNativeValueUpdates();
    }
  }

  _startListeningToNativeValueUpdates() {
    if (this.__nativeAnimatedValueListener) {
      return;
    }

    NativeAnimatedAPI.startListeningToAnimatedNodeValue(this.__getNativeTag());
    this.__nativeAnimatedValueListener = NativeAnimatedHelper.nativeEventEmitter.addListener(
      'onAnimatedValueUpdate',
      data => {
        if (data.tag !== this.__getNativeTag()) {
          return;
        }
        this._updateValue(data.value, false /* flush */);
      },
    );
  }

  _stopListeningForNativeValueUpdates() {
    if (!this.__nativeAnimatedValueListener) {
      return;
    }

    this.__nativeAnimatedValueListener.remove();
    this.__nativeAnimatedValueListener = null;
    NativeAnimatedAPI.stopListeningToAnimatedNodeValue(this.__getNativeTag());
  }

  /**
   * Stops any running animation or tracking. `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#stopanimation
   */
  stopAnimation(callback?: ?(value: number) => void): void {
    this.stopTracking();
    this._animation && this._animation.stop();
    this._animation = null;
    callback && callback(this.__getValue());
  }

  /**
   * Stops any animation and resets the value to its original.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#resetanimation
   */
  resetAnimation(callback?: ?(value: number) => void): void {
    this.stopAnimation(callback);
    this._value = this._startingValue;
  }

  /**
   * Interpolates the value before updating the property, e.g. mapping 0-1 to
   * 0-10.
   */
  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  /**
   * Typically only used internally, but could be used by a custom Animation
   * class.
   *
   * See http://facebook.github.io/react-native/docs/animatedvalue.html#animate
   */
  animate(animation: Animation, callback: ?EndCallback): void {
    let handle = null;
    if (animation.__isInteraction) {
      handle = InteractionManager.createInteractionHandle();
    }
    const previousAnimation = this._animation;
    this._animation && this._animation.stop();
    this._animation = animation;
    animation.start(
      this._value,
      value => {
        // Natively driven animations will never call into that callback, therefore we can always
        // pass flush = true to allow the updated value to propagate to native with setNativeProps
        this._updateValue(value, true /* flush */);
      },
      result => {
        this._animation = null;
        if (handle !== null) {
          InteractionManager.clearInteractionHandle(handle);
        }
        callback && callback(result);
      },
      previousAnimation,
      this,
    );
  }

  /**
   * Typically only used internally.
   */
  stopTracking(): void {
    this._tracking && this._tracking.__detach();
    this._tracking = null;
  }

  /**
   * Typically only used internally.
   */
  track(tracking: AnimatedTracking): void {
    this.stopTracking();
    this._tracking = tracking;
  }

  _updateValue(value: number, flush: boolean): void {
    this._value = value;
    if (flush) {
      _flush(this);
    }
    for (const key in this._listeners) {
      this._listeners[key]({value: this.__getValue()});
    }
  }

  __getNativeConfig(): Object {
    return {
      type: 'value',
      value: this._value,
      offset: this._offset,
    };
  }
}

module.exports = AnimatedValue;
