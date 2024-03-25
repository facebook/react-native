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
import type {RgbaValue} from '../nodes/AnimatedColor';
import type AnimatedInterpolation from '../nodes/AnimatedInterpolation';
import type AnimatedValue from '../nodes/AnimatedValue';
import type AnimatedValueXY from '../nodes/AnimatedValueXY';
import type {AnimationConfig, EndCallback} from './Animation';

import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedColor from '../nodes/AnimatedColor';
import Animation from './Animation';

export type TimingAnimationConfig = $ReadOnly<{
  ...AnimationConfig,
  toValue:
    | number
    | AnimatedValue
    | {
        x: number,
        y: number,
        ...
      }
    | AnimatedValueXY
    | RgbaValue
    | AnimatedColor
    | AnimatedInterpolation<number>,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
}>;

export type TimingAnimationConfigSingle = $ReadOnly<{
  ...AnimationConfig,
  toValue: number,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
}>;

let _easeInOut;
function easeInOut() {
  if (!_easeInOut) {
    const Easing = require('../Easing').default;
    _easeInOut = Easing.inOut(Easing.ease);
  }
  return _easeInOut;
}

export default class TimingAnimation extends Animation {
  _startTime: number;
  _fromValue: number;
  _toValue: number;
  _duration: number;
  _delay: number;
  _easing: (value: number) => number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _timeout: any;
  _useNativeDriver: boolean;
  _platformConfig: ?PlatformConfig;

  constructor(config: TimingAnimationConfigSingle) {
    super();
    this._toValue = config.toValue;
    this._easing = config.easing ?? easeInOut();
    this._duration = config.duration ?? 500;
    this._delay = config.delay ?? 0;
    this.__iterations = config.iterations ?? 1;
    this._useNativeDriver = NativeAnimatedHelper.shouldUseNativeDriver(config);
    this._platformConfig = config.platformConfig;
    this.__isInteraction = config.isInteraction ?? !this._useNativeDriver;
  }

  __getNativeAnimationConfig(): any {
    const frameDuration = 1000.0 / 60.0;
    const frames = [];
    const numFrames = Math.round(this._duration / frameDuration);
    for (let frame = 0; frame < numFrames; frame++) {
      frames.push(this._easing(frame / numFrames));
    }
    frames.push(this._easing(1));
    return {
      type: 'frames',
      frames,
      toValue: this._toValue,
      iterations: this.__iterations,
      platformConfig: this._platformConfig,
    };
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue,
  ): void {
    this.__active = true;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;

    const start = () => {
      if (!this._useNativeDriver && animatedValue.__isNative === true) {
        throw new Error(
          'Attempting to run JS driven animation on animated node ' +
            'that has been moved to "native" earlier by starting an ' +
            'animation with `useNativeDriver: true`',
        );
      }

      // Animations that sometimes have 0 duration and sometimes do not
      // still need to use the native driver when duration is 0 so as to
      // not cause intermixed JS and native animations.
      if (this._duration === 0 && !this._useNativeDriver) {
        this._onUpdate(this._toValue);
        this.__debouncedOnEnd({finished: true});
      } else {
        this._startTime = Date.now();
        if (this._useNativeDriver) {
          this.__startNativeAnimation(animatedValue);
        } else {
          this._animationFrame = requestAnimationFrame(
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            this.onUpdate.bind(this),
          );
        }
      }
    };
    if (this._delay) {
      this._timeout = setTimeout(start, this._delay);
    } else {
      start();
    }
  }

  onUpdate(): void {
    const now = Date.now();
    if (now >= this._startTime + this._duration) {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
      } else {
        this._onUpdate(
          this._fromValue + this._easing(1) * (this._toValue - this._fromValue),
        );
      }
      this.__debouncedOnEnd({finished: true});
      return;
    }

    this._onUpdate(
      this._fromValue +
        this._easing((now - this._startTime) / this._duration) *
          (this._toValue - this._fromValue),
    );
    if (this.__active) {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    super.stop();
    this.__active = false;
    clearTimeout(this._timeout);
    global.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}
