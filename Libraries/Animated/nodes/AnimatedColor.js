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

import AnimatedValue from './AnimatedValue';
import AnimatedWithChildren from './AnimatedWithChildren';
import invariant from 'invariant';

type ColorListenerCallback = (value: string) => mixed;

let _uniqueId = 1;

export default class AnimatedColor extends AnimatedWithChildren {
  r: AnimatedValue;
  g: AnimatedValue;
  b: AnimatedValue;
  a: AnimatedValue;
  _listeners: {
    [key: string]: {
      r: string,
      g: string,
      b: string,
      a: string,
      ...
    },
    ...
  };

  constructor(
    valueIn?: ?{
      +r: number | AnimatedValue,
      +g: number | AnimatedValue,
      +b: number | AnimatedValue,
      +a: number | AnimatedValue,
      ...
    }, // TODO: support string color and platform color
  ) {
    super();
    const value: any = valueIn || {r: 0, g: 0, b: 0, a: 1}; // @flowfixme: shouldn't need `: any`
    if (
      typeof value.r === 'number' &&
      typeof value.g === 'number' &&
      typeof value.b === 'number' &&
      typeof value.a === 'number'
    ) {
      this.r = new AnimatedValue(value.r);
      this.g = new AnimatedValue(value.g);
      this.b = new AnimatedValue(value.b);
      this.a = new AnimatedValue(value.a);
    } else {
      invariant(
        value.r instanceof AnimatedValue &&
          value.g instanceof AnimatedValue &&
          value.b instanceof AnimatedValue &&
          value.a instanceof AnimatedValue,
        'AnimatedColor must be initialized with an object of numbers or AnimatedValues.',
      );
      this.r = value.r;
      this.g = value.g;
      this.b = value.b;
      this.a = value.a;
    }
    this._listeners = {};
  }

  /**
   * Directly set the value. This will stop any animations running on the value
   * and update all the bound properties.
   */
  setValue(value: {r: number, g: number, b: number, a: number, ...}) {
    this.r.setValue(value.r);
    this.g.setValue(value.g);
    this.b.setValue(value.b);
    this.a.setValue(value.a);
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether
   * via `setValue`, an animation, or `Animated.event`. Useful for compensating
   * things like the start of a pan gesture.
   */
  setOffset(offset: {r: number, g: number, b: number, a: number, ...}) {
    this.r.setOffset(offset.r);
    this.g.setOffset(offset.g);
    this.b.setOffset(offset.b);
    this.a.setOffset(offset.a);
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   */
  flattenOffset(): void {
    this.r.flattenOffset();
    this.g.flattenOffset();
    this.b.flattenOffset();
    this.a.flattenOffset();
  }

  /**
   * Sets the offset value to the base value, and resets the base value to
   * zero. The final output of the value is unchanged.
   */
  extractOffset(): void {
    this.r.extractOffset();
    this.g.extractOffset();
    this.b.extractOffset();
    this.a.extractOffset();
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to synchronously read
   * the value because it might be driven natively.
   *
   * Returns a string that serves as an identifier for the listener.
   */
  addListener(callback: ColorListenerCallback): string {
    const id = String(_uniqueId++);
    const jointCallback = ({value: number}) => {
      callback(this.__getValue());
    };
    this._listeners[id] = {
      r: this.r.addListener(jointCallback),
      g: this.g.addListener(jointCallback),
      b: this.b.addListener(jointCallback),
      a: this.a.addListener(jointCallback),
    };
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   */
  removeListener(id: string): void {
    this.r.removeListener(this._listeners[id].r);
    this.g.removeListener(this._listeners[id].g);
    this.b.removeListener(this._listeners[id].b);
    this.a.removeListener(this._listeners[id].a);
    delete this._listeners[id];
  }

  /**
   * Remove all registered listeners.
   */
  removeAllListeners(): void {
    this.r.removeAllListeners();
    this.g.removeAllListeners();
    this.b.removeAllListeners();
    this.a.removeAllListeners();
    this._listeners = {};
  }

  /**
   * Stops any running animation or tracking. `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   */
  stopAnimation(callback?: (value: string) => void): void {
    this.r.stopAnimation();
    this.g.stopAnimation();
    this.b.stopAnimation();
    this.a.stopAnimation();
    callback && callback(this.__getValue());
  }

  /**
   * Stops any animation and resets the value to its original.
   */
  resetAnimation(callback?: (value: string) => void): void {
    this.r.resetAnimation();
    this.g.resetAnimation();
    this.b.resetAnimation();
    this.a.resetAnimation();
    callback && callback(this.__getValue());
  }

  __getValue(): string {
    return `rgba(${this.r.__getValue()}, ${this.g.__getValue()}, ${this.b.__getValue()}, ${this.a.__getValue()})`;
  }

  __attach(): void {
    this.r.__addChild(this);
    this.g.__addChild(this);
    this.b.__addChild(this);
    this.a.__addChild(this);
    super.__attach();
  }

  __detach(): void {
    this.r.__removeChild(this);
    this.g.__removeChild(this);
    this.b.__removeChild(this);
    this.a.__removeChild(this);
    super.__detach();
  }
}
