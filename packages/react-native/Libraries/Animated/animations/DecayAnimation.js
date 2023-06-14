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
import type AnimatedValue from '../nodes/AnimatedValue';
import type {AnimationConfig, EndCallback} from './Animation';

import NativeAnimatedHelper from '../NativeAnimatedHelper';
import Animation from './Animation';

export type DecayAnimationConfig = {
  ...AnimationConfig,
  velocity:
    | number
    | {
        x: number,
        y: number,
        ...
      },
  deceleration?: number,
};

export type DecayAnimationConfigSingle = {
  ...AnimationConfig,
  velocity: number,
  deceleration?: number,
};

export default class DecayAnimation extends Animation {
  _startTime: number;
  _lastValue: number;
  _fromValue: number;
  _deceleration: number;
  _velocity: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _useNativeDriver: boolean;
  _platformConfig: ?PlatformConfig;

  constructor(config: DecayAnimationConfigSingle) {
    super();
    this._deceleration = config.deceleration ?? 0.998;
    this._velocity = config.velocity;
    this._useNativeDriver = NativeAnimatedHelper.shouldUseNativeDriver(config);
    this._platformConfig = config.platformConfig;
    this.__isInteraction = config.isInteraction ?? !this._useNativeDriver;
    this.__iterations = config.iterations ?? 1;
  }

  __getNativeAnimationConfig(): {|
    deceleration: number,
    iterations: number,
    platformConfig: ?PlatformConfig,
    type: $TEMPORARY$string<'decay'>,
    velocity: number,
  |} {
    return {
      type: 'decay',
      deceleration: this._deceleration,
      velocity: this._velocity,
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
    this._lastValue = fromValue;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;
    this._startTime = Date.now();

    if (!this._useNativeDriver && animatedValue.__isNative === true) {
      throw new Error(
        'Attempting to run JS driven animation on animated node ' +
          'that has been moved to "native" earlier by starting an ' +
          'animation with `useNativeDriver: true`',
      );
    }

    if (this._useNativeDriver) {
      this.__startNativeAnimation(animatedValue);
    } else {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  onUpdate(): void {
    const now = Date.now();

    const value =
      this._fromValue +
      (this._velocity / (1 - this._deceleration)) *
        (1 - Math.exp(-(1 - this._deceleration) * (now - this._startTime)));

    this._onUpdate(value);

    if (Math.abs(this._lastValue - value) < 0.1) {
      this.__debouncedOnEnd({finished: true});
      return;
    }

    this._lastValue = value;
    if (this.__active) {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    super.stop();
    this.__active = false;
    global.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}
