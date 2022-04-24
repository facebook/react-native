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

const NativeAnimatedHelper = require('../NativeAnimatedHelper');
import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type AnimatedValue from '../nodes/AnimatedValue';

export type EndResult = {finished: boolean, ...};
export type EndCallback = (result: EndResult) => void;

export type AnimationConfig = {
  isInteraction?: boolean,
  useNativeDriver: boolean,
  platformConfig?: PlatformConfig,
  onComplete?: ?EndCallback,
  iterations?: number,
};

let startNativeAnimationNextId = 1;

// Important note: start() and stop() will only be called at most once.
// Once an animation has been stopped or finished its course, it will
// not be reused.
class Animation {
  __active: boolean;
  __isInteraction: boolean;
  __nativeId: number;
  __onEnd: ?EndCallback;
  __iterations: number;
  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue,
  ): void {}
  stop(): void {
    if (this.__nativeId) {
      NativeAnimatedHelper.API.stopAnimation(this.__nativeId);
    }
  }
  __getNativeAnimationConfig(): any {
    // Subclasses that have corresponding animation implementation done in native
    // should override this method
    throw new Error('This animation type cannot be offloaded to native');
  }
  // Helper function for subclasses to make sure onEnd is only called once.
  __debouncedOnEnd(result: EndResult): void {
    const onEnd = this.__onEnd;
    this.__onEnd = null;
    onEnd && onEnd(result);
  }
  __startNativeAnimation(animatedValue: AnimatedValue): void {
    const startNativeAnimationWaitId = `${startNativeAnimationNextId}:startAnimation`;
    startNativeAnimationNextId += 1;
    NativeAnimatedHelper.API.setWaitingForIdentifier(
      startNativeAnimationWaitId,
    );
    try {
      const config = this.__getNativeAnimationConfig();
      animatedValue.__makeNative(config.platformConfig);
      this.__nativeId = NativeAnimatedHelper.generateNewAnimationId();
      NativeAnimatedHelper.API.startAnimatingNode(
        this.__nativeId,
        animatedValue.__getNativeTag(),
        config,
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        this.__debouncedOnEnd.bind(this),
      );
    } catch (e) {
      throw e;
    } finally {
      NativeAnimatedHelper.API.unsetWaitingForIdentifier(
        startNativeAnimationWaitId,
      );
    }
  }
}

module.exports = Animation;
