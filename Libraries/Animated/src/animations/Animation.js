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

const NativeAnimatedHelper = require('../NativeAnimatedHelper');

import type AnimatedValue from '../nodes/AnimatedValue';

export type EndResult = {finished: boolean};
export type EndCallback = (result: EndResult) => void;

export type AnimationConfig = {
  isInteraction?: boolean,
  useNativeDriver?: boolean,
  onComplete?: ?EndCallback,
  iterations?: number,
};

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
    NativeAnimatedHelper.API.enableQueue();
    animatedValue.__makeNative();
    NativeAnimatedHelper.API.disableQueue();
    this.__nativeId = NativeAnimatedHelper.generateNewAnimationId();
    NativeAnimatedHelper.API.startAnimatingNode(
      this.__nativeId,
      animatedValue.__getNativeTag(),
      this.__getNativeAnimationConfig(),
      this.__debouncedOnEnd.bind(this),
    );
  }
}

module.exports = Animation;
