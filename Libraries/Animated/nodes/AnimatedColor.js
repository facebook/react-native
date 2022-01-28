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
import normalizeColor from '../../StyleSheet/normalizeColor';
import {processColorObject} from '../../StyleSheet/PlatformColorValueTypes';

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {NativeColorValue} from '../../StyleSheet/PlatformColorValueTypes';

type ColorListenerCallback = (value: string) => mixed;
type RgbaValue = {
  +r: number,
  +g: number,
  +b: number,
  +a: number,
  ...
};
type RgbaAnimatedValue = {
  +r: AnimatedValue,
  +g: AnimatedValue,
  +b: AnimatedValue,
  +a: AnimatedValue,
  ...
};

const defaultColor: RgbaValue = {r: 0, g: 0, b: 0, a: 1.0};
let _uniqueId = 1;

/* eslint no-bitwise: 0 */
function processColor(color?: ?ColorValue): ?(RgbaValue | NativeColorValue) {
  if (color === undefined || color === null) {
    return null;
  }

  let normalizedColor = normalizeColor(color);
  if (normalizedColor === undefined || normalizedColor === null) {
    return null;
  }

  if (typeof normalizedColor === 'object') {
    const processedColorObj = processColorObject(normalizedColor);
    if (processedColorObj != null) {
      return processedColorObj;
    }
  } else if (typeof normalizedColor === 'number') {
    const r = (normalizedColor & 0xff000000) >>> 24;
    const g = (normalizedColor & 0x00ff0000) >>> 16;
    const b = (normalizedColor & 0x0000ff00) >>> 8;
    const a = (normalizedColor & 0x000000ff) / 255;

    return {r, g, b, a};
  }

  return null;
}

function isRgbaValue(value: any): boolean {
  return (
    value &&
    typeof value.r === 'number' &&
    typeof value.g === 'number' &&
    typeof value.b === 'number' &&
    typeof value.a === 'number'
  );
}

function isRgbaAnimatedValue(value: any): boolean {
  return (
    value &&
    value.r instanceof AnimatedValue &&
    value.g instanceof AnimatedValue &&
    value.b instanceof AnimatedValue &&
    value.a instanceof AnimatedValue
  );
}

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

  constructor(valueIn?: ?(RgbaValue | RgbaAnimatedValue | ColorValue)) {
    super();
    let value: RgbaValue | RgbaAnimatedValue | ColorValue =
      valueIn || defaultColor;

    if (isRgbaAnimatedValue(value)) {
      // $FlowIgnore[incompatible-cast] - Type is verified above
      const rgbaAnimatedValue: RgbaAnimatedValue = (value: RgbaAnimatedValue);
      this.r = rgbaAnimatedValue.r;
      this.g = rgbaAnimatedValue.g;
      this.b = rgbaAnimatedValue.b;
      this.a = rgbaAnimatedValue.a;
    } else {
      // Handle potential parsable string color or platform color object
      if (!isRgbaValue(value)) {
        // $FlowIgnore[incompatible-cast] - Type is verified via conditionals
        value = processColor((value: ColorValue)) || {r: 0, g: 0, b: 0, a: 1.0};
        // TODO: support platform color
      }

      // $FlowIgnore[incompatible-cast] - Type is verified via conditionals
      const rgbaValue: RgbaValue = (value: RgbaValue);
      this.r = new AnimatedValue(rgbaValue.r);
      this.g = new AnimatedValue(rgbaValue.g);
      this.b = new AnimatedValue(rgbaValue.b);
      this.a = new AnimatedValue(rgbaValue.a);
    }
    this._listeners = {};
  }

  /**
   * Directly set the value. This will stop any animations running on the value
   * and update all the bound properties.
   */
  setValue(value: {r: number, g: number, b: number, a: number, ...}): void {
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
  setOffset(offset: {r: number, g: number, b: number, a: number, ...}): void {
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
