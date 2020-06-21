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

const UIManager = require('../ReactNative/UIManager');
import type {Spec as FabricUIManagerSpec} from '../ReactNative/FabricUIManager';
import type {
  LayoutAnimationConfig as LayoutAnimationConfig_,
  LayoutAnimationType,
  LayoutAnimationProperty,
} from '../Renderer/shims/ReactNativeTypes';

import Platform from '../Utilities/Platform';

// Reexport type
export type LayoutAnimationConfig = LayoutAnimationConfig_;

function configureNext(
  config: LayoutAnimationConfig,
  onAnimationDidEnd?: Function,
) {
  if (!Platform.isTesting) {
    if (UIManager?.configureNextLayoutAnimation) {
      UIManager.configureNextLayoutAnimation(
        config,
        onAnimationDidEnd ?? function() {},
        function() {} /* unused onError */,
      );
    }
    const FabricUIManager: FabricUIManagerSpec = global?.nativeFabricUIManager;
    if (FabricUIManager?.configureNextLayoutAnimation) {
      global?.nativeFabricUIManager?.configureNextLayoutAnimation(
        config,
        onAnimationDidEnd ?? function() {},
        function() {} /* unused onError */,
      );
    }
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
  spring: {
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
  },
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
    onAnimationDidEnd?: any,
  ) => void),
  linear: (configureNext.bind(null, Presets.linear): (
    onAnimationDidEnd?: any,
  ) => void),
  spring: (configureNext.bind(null, Presets.spring): (
    onAnimationDidEnd?: any,
  ) => void),
};

module.exports = LayoutAnimation;
