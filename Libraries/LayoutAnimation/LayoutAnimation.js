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

import Platform from 'Platform';
const UIManager = require('UIManager');

type Type =
  | 'spring'
  | 'linear'
  | 'easeInEaseOut'
  | 'easeIn'
  | 'easeOut'
  | 'keyboard';

type Property = 'opacity' | 'scaleX' | 'scaleY' | 'scaleXY';

type AnimationConfig = $ReadOnly<{|
  duration?: number,
  delay?: number,
  springDamping?: number,
  initialVelocity?: number,
  type?: Type,
  property?: Property,
|}>;

type LayoutAnimationConfig = $ReadOnly<{|
  duration: number,
  create?: AnimationConfig,
  update?: AnimationConfig,
  delete?: AnimationConfig,
|}>;

function configureNext(
  config: LayoutAnimationConfig,
  onAnimationDidEnd?: Function,
) {
  if (!Platform.isTesting) {
    UIManager.configureNextLayoutAnimation(
      config,
      onAnimationDidEnd ?? function() {},
      function() {
        /* unused */
      },
    );
  }
}

function create(
  duration: number,
  type: Type,
  property: Property,
): LayoutAnimationConfig {
  return {
    duration,
    create: {type, property},
    update: {type},
    delete: {type, property},
  };
}

const Presets = {
  easeInEaseOut: create(300, 'easeInEaseOut', 'opacity'),
  linear: create(500, 'linear', 'opacity'),
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
  easeInEaseOut: configureNext.bind(null, Presets.easeInEaseOut),
  linear: configureNext.bind(null, Presets.linear),
  spring: configureNext.bind(null, Presets.spring),
};

module.exports = LayoutAnimation;
