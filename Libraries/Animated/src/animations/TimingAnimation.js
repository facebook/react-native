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

const AnimatedValue = require('../nodes/AnimatedValue');
const AnimatedValueXY = require('../nodes/AnimatedValueXY');
const Animation = require('./Animation');

const {shouldUseNativeDriver} = require('../NativeAnimatedHelper');

import type {AnimationConfig, EndCallback} from './Animation';

export type TimingAnimationConfig = AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
};

export type TimingAnimationConfigSingle = AnimationConfig & {
  toValue: number | AnimatedValue,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
};

let _easeInOut;
function easeInOut() {
  if (!_easeInOut) {
    const Easing = require('Easing');
    _easeInOut = Easing.inOut(Easing.ease);
  }
  return _easeInOut;
}

class TimingAnimation extends Animation {
  _startTime: number;
  _fromValue: number;
  _toValue: any;
  _duration: number;
  _delay: number;
  _easing: (value: number) => number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _timeout: any;
  _useNativeDriver: boolean;

  constructor(config: TimingAnimationConfigSingle) {
    super();
    this._toValue = config.toValue;
    this._easing = config.easing !== undefined ? config.easing : easeInOut();
    this._duration = config.duration !== undefined ? config.duration : 500;
    this._delay = config.delay !== undefined ? config.delay : 0;
    this.__iterations = config.iterations !== undefined ? config.iterations : 1;
    this.__isInteraction =
      config.isInteraction !== undefined ? config.isInteraction : true;
    this._useNativeDriver = shouldUseNativeDriver(config);
  }

  __getNativeAnimationConfig(): any {
    const frameDuration = 1000.0 / 60.0;
    const frames = [];
    for (let dt = 0.0; dt < this._duration; dt += frameDuration) {
      frames.push(this._easing(dt / this._duration));
    }
    frames.push(this._easing(1));
    return {
      type: 'frames',
      frames,
      toValue: this._toValue,
      iterations: this.__iterations,
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

module.exports = TimingAnimation;
