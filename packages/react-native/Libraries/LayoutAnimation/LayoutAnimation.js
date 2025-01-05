/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  LayoutAnimationConfig as LayoutAnimationConfig_,
  LayoutAnimationProperty,
  LayoutAnimationType,
} from '../Renderer/shims/ReactNativeTypes';

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import {getFabricUIManager} from '../ReactNative/FabricUIManager';
import Platform from '../Utilities/Platform';

const UIManager = require('../ReactNative/UIManager');

// Reexport type
export type LayoutAnimationConfig = LayoutAnimationConfig_;

type OnAnimationDidEndCallback = () => void;
type OnAnimationDidFailCallback = () => void;

let isLayoutAnimationEnabled: boolean =
  ReactNativeFeatureFlags.isLayoutAnimationEnabled();

function setEnabled(value: boolean) {
  isLayoutAnimationEnabled = isLayoutAnimationEnabled;
}

/**
 * Configures the next commit to be animated.
 *
 * onAnimationDidEnd is guaranteed to be called when the animation completes.
 * onAnimationDidFail is *never* called in the classic, pre-Fabric renderer,
 * and never has been. In the new renderer (Fabric) it is called only if configuration
 * parsing fails.
 */
function configureNext(
  config: LayoutAnimationConfig,
  onAnimationDidEnd?: OnAnimationDidEndCallback,
  onAnimationDidFail?: OnAnimationDidFailCallback,
) {
  if (Platform.isDisableAnimations) {
    return;
  }

  if (!isLayoutAnimationEnabled) {
    return;
  }

  // Since LayoutAnimations may possibly be disabled for now on iOS (Fabric),
  // or Android (non-Fabric) we race a setTimeout with animation completion,
  // in case onComplete is never called
  // from native. Once LayoutAnimations+Fabric unconditionally ship everywhere, we can
  // delete this mechanism at least in the Fabric branch.
  let animationCompletionHasRun = false;
  const onAnimationComplete = () => {
    if (animationCompletionHasRun) {
      return;
    }
    animationCompletionHasRun = true;
    clearTimeout(raceWithAnimationId);
    onAnimationDidEnd?.();
  };
  const raceWithAnimationId = setTimeout(
    onAnimationComplete,
    (config.duration ?? 0) + 17 /* one frame + 1ms */,
  );

  // In Fabric, LayoutAnimations are unconditionally enabled for Android, and
  // conditionally enabled on iOS (pending fully shipping; this is a temporary state).
  const FabricUIManager = getFabricUIManager();
  if (FabricUIManager?.configureNextLayoutAnimation) {
    global?.nativeFabricUIManager?.configureNextLayoutAnimation(
      config,
      onAnimationComplete,
      onAnimationDidFail ??
        function () {} /* this will only be called if configuration parsing fails */,
    );
    return;
  }

  // This will only run if Fabric is *not* installed.
  // If you have Fabric + non-Fabric running in the same VM, non-Fabric LayoutAnimations
  // will not work.
  if (UIManager?.configureNextLayoutAnimation) {
    UIManager.configureNextLayoutAnimation(
      config,
      onAnimationComplete ?? function () {},
      onAnimationDidFail ??
        function () {} /* this should never be called in Non-Fabric */,
    );
  }
}

function create(
  duration: number,
  type: LayoutAnimationType,
  property: LayoutAnimationProperty,
): LayoutAnimationConfig {
  return {
    duration,
    create: {type, property},
    update: {type},
    delete: {type, property},
  };
}

const Presets = {
  easeInEaseOut: (create(
    300,
    'easeInEaseOut',
    'opacity',
  ): LayoutAnimationConfig),
  linear: (create(500, 'linear', 'opacity'): LayoutAnimationConfig),
  spring: ({
    duration: 700,
    create: {
      type: 'linear',
      property: 'opacity',
    },
    update: {
      type: 'spring',
      springDamping: 0.4,
    },
    delete: {
      type: 'linear',
      property: 'opacity',
    },
  }: LayoutAnimationConfig),
};

/**
 * Automatically animates views to their new positions when the
 * next layout happens.
 *
 * A common way to use this API is to call it before calling `setState`.
 *
 * Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:
 *
 *     UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
 */
const LayoutAnimation = {
  /**
   * Schedules an animation to happen on the next layout.
   *
   * @param config Specifies animation properties:
   *
   *   - `duration` in milliseconds
   *   - `create`, `AnimationConfig` for animating in new views
   *   - `update`, `AnimationConfig` for animating views that have been updated
   *
   * @param onAnimationDidEnd Called when the animation finished.
   * Only supported on iOS.
   * @param onError Called on error. Only supported on iOS.
   */
  configureNext,
  /**
   * Helper for creating a config for `configureNext`.
   */
  create,
  Types: Object.freeze({
    spring: 'spring',
    linear: 'linear',
    easeInEaseOut: 'easeInEaseOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    keyboard: 'keyboard',
  }),
  Properties: Object.freeze({
    opacity: 'opacity',
    scaleX: 'scaleX',
    scaleY: 'scaleY',
    scaleXY: 'scaleXY',
  }),
  checkConfig(...args: Array<mixed>) {
    console.error('LayoutAnimation.checkConfig(...) has been disabled.');
  },
  Presets,
  easeInEaseOut: (configureNext.bind(null, Presets.easeInEaseOut): (
    onAnimationDidEnd?: OnAnimationDidEndCallback,
  ) => void),
  linear: (configureNext.bind(null, Presets.linear): (
    onAnimationDidEnd?: OnAnimationDidEndCallback,
  ) => void),
  spring: (configureNext.bind(null, Presets.spring): (
    onAnimationDidEnd?: OnAnimationDidEndCallback,
  ) => void),
  setEnabled,
};

module.exports = LayoutAnimation;
