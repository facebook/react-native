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
import type AnimatedNode from '../nodes/AnimatedNode';
import type AnimatedValue from '../nodes/AnimatedValue';

import Platform from '../../Utilities/Platform';
import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedColor from '../nodes/AnimatedColor';
import AnimatedProps from '../nodes/AnimatedProps';
import AnimatedValueXY from '../nodes/AnimatedValueXY';

export type EndResult = {finished: boolean, value?: number, ...};
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
export default class Animation {
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

  __findAnimatedPropsNodes(node: AnimatedNode): Array<AnimatedProps> {
    const result = [];

    if (node instanceof AnimatedProps) {
      result.push(node);
      return result;
    }

    // Vectorized animations (animations on AnimatedValueXY, AnimatedColor nodes)
    // are split into multiple animations for each component that execute in parallel.
    // Calling update() on AnimatedProps when each animation completes results in
    // potential flickering as all animations that are part of the vectorized animation
    // may not have completed yet. For example, only the animation for the red channel of
    // an animating color may have been completed, resulting in a temporary red color
    // being rendered. So, for now, ignore AnimatedProps that use a vectorized animation.
    if (
      Platform.OS === 'ios' &&
      (node instanceof AnimatedValueXY || node instanceof AnimatedColor)
    ) {
      return result;
    }

    for (const child of node.__getChildren()) {
      result.push(...this.__findAnimatedPropsNodes(child));
    }

    return result;
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
        result => {
          this.__debouncedOnEnd(result);

          // When using natively driven animations, once the animation completes,
          // we need to ensure that the JS side nodes are synced with the updated
          // values.
          const {value} = result;
          if (value != null) {
            animatedValue.__onAnimatedValueUpdateReceived(value);

            // Once the JS side node is synced with the updated values, trigger an
            // update on the AnimatedProps nodes to call any registered callbacks.
            this.__findAnimatedPropsNodes(animatedValue).forEach(node =>
              node.update(),
            );
          }
        },
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
