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

const AnimatedValue = require('./AnimatedValue');
const AnimatedWithChildren = require('./AnimatedWithChildren');

const invariant = require('invariant');

type ValueXYListenerCallback = (value: {
  x: number,
  y: number,
  ...
}) => mixed;

let _uniqueId = 1;

/**
 * 2D Value for driving 2D animations, such as pan gestures. Almost identical
 * API to normal `Animated.Value`, but multiplexed.
 *
 * See http://facebook.github.io/react-native/docs/animatedvaluexy.html
 */
class AnimatedValueXY extends AnimatedWithChildren {
  x: AnimatedValue;
  y: AnimatedValue;
  _listeners: {
    [key: string]: {
      x: string,
      y: string,
      ...
    },
    ...,
  };

  constructor(
    valueIn?: ?{
      +x: number | AnimatedValue,
      +y: number | AnimatedValue,
      ...
    },
  ) {
    super();
    const value: any = valueIn || {x: 0, y: 0}; // @flowfixme: shouldn't need `: any`
    if (typeof value.x === 'number' && typeof value.y === 'number') {
      this.x = new AnimatedValue(value.x);
      this.y = new AnimatedValue(value.y);
    } else {
      invariant(
        value.x instanceof AnimatedValue && value.y instanceof AnimatedValue,
        'AnimatedValueXY must be initialized with an object of numbers or ' +
          'AnimatedValues.',
      );
      this.x = value.x;
      this.y = value.y;
    }
    this._listeners = {};
  }

  /**
   * Directly set the value. This will stop any animations running on the value
   * and update all the bound properties.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#setvalue
   */
  setValue(value: {x: number, y: number, ...}) {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether
   * via `setValue`, an animation, or `Animated.event`. Useful for compensating
   * things like the start of a pan gesture.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#setoffset
   */
  setOffset(offset: {x: number, y: number, ...}) {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#flattenoffset
   */
  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  /**
   * Sets the offset value to the base value, and resets the base value to
   * zero. The final output of the value is unchanged.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#extractoffset
   */
  extractOffset(): void {
    this.x.extractOffset();
    this.y.extractOffset();
  }

  __getValue(): {
    x: number,
    y: number,
    ...
  } {
    return {
      x: this.x.__getValue(),
      y: this.y.__getValue(),
    };
  }

  /**
   * Stops any animation and resets the value to its original.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#resetanimation
   */
  resetAnimation(
    callback?: (value: {
      x: number,
      y: number,
      ...
    }) => void,
  ): void {
    this.x.resetAnimation();
    this.y.resetAnimation();
    callback && callback(this.__getValue());
  }

  /**
   * Stops any running animation or tracking. `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#stopanimation
   */
  stopAnimation(
    callback?: (value: {
      x: number,
      y: number,
      ...
    }) => void,
  ): void {
    this.x.stopAnimation();
    this.y.stopAnimation();
    callback && callback(this.__getValue());
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to synchronously read
   * the value because it might be driven natively.
   *
   * Returns a string that serves as an identifier for the listener.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#addlistener
   */
  addListener(callback: ValueXYListenerCallback): string {
    const id = String(_uniqueId++);
    const jointCallback = ({value: number}) => {
      callback(this.__getValue());
    };
    this._listeners[id] = {
      x: this.x.addListener(jointCallback),
      y: this.y.addListener(jointCallback),
    };
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#removelistener
   */
  removeListener(id: string): void {
    this.x.removeListener(this._listeners[id].x);
    this.y.removeListener(this._listeners[id].y);
    delete this._listeners[id];
  }

  /**
   * Remove all registered listeners.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#removealllisteners
   */
  removeAllListeners(): void {
    this.x.removeAllListeners();
    this.y.removeAllListeners();
    this._listeners = {};
  }

  /**
   * Converts `{x, y}` into `{left, top}` for use in style.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#getlayout
   */
  getLayout(): {[key: string]: AnimatedValue, ...} {
    return {
      left: this.x,
      top: this.y,
    };
  }

  /**
   * Converts `{x, y}` into a useable translation transform.
   *
   * See http://facebook.github.io/react-native/docs/animatedvaluexy.html#gettranslatetransform
   */
  getTranslateTransform(): Array<{[key: string]: AnimatedValue, ...}> {
    return [{translateX: this.x}, {translateY: this.y}];
  }
}

module.exports = AnimatedValueXY;
