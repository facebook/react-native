/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LayoutAnimation
 * @flow
 */
'use strict';

var PropTypes = require('ReactPropTypes');
var RCTUIManager = require('NativeModules').UIManager;

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var keyMirror = require('keyMirror');

var TypesEnum = {
  spring: true,
  linear: true,
  easeInEaseOut: true,
  easeIn: true,
  easeOut: true,
  keyboard: true,
};
var Types = keyMirror(TypesEnum);

var PropertiesEnum = {
  opacity: true,
  scaleXY: true,
};
var Properties = keyMirror(PropertiesEnum);

var animChecker = createStrictShapeTypeChecker({
  duration: PropTypes.number,
  delay: PropTypes.number,
  springDamping: PropTypes.number,
  initialVelocity: PropTypes.number,
  type: PropTypes.oneOf(
    Object.keys(Types)
  ),
  property: PropTypes.oneOf( // Only applies to create/delete
    Object.keys(Properties)
  ),
});

type Anim = {
  duration?: number;
  delay?: number;
  springDamping?: number;
  initialVelocity?: number;
  type?: $Enum<typeof TypesEnum>;
  property?: $Enum<typeof PropertiesEnum>;
}

var configChecker = createStrictShapeTypeChecker({
  duration: PropTypes.number.isRequired,
  create: animChecker,
  update: animChecker,
  delete: animChecker,
});

type Config = {
  duration: number;
  create?: Anim;
  update?: Anim;
  delete?: Anim;
}

function configureNext(config: Config, onAnimationDidEnd?: Function) {
  configChecker({config}, 'config', 'LayoutAnimation.configureNext');
  RCTUIManager.configureNextLayoutAnimation(
    config, onAnimationDidEnd || function() {}, function() { /* unused */ }
  );
}

function create(duration: number, type, creationProp): Config {
  return {
    duration,
    create: {
      type,
      property: creationProp,
    },
    update: {
      type,
    },
  };
}

var Presets = {
  easeInEaseOut: create(
    300, Types.easeInEaseOut, Properties.opacity
  ),
  linear: create(
    500, Types.linear, Properties.opacity
  ),
  spring: {
    duration: 700,
    create: {
      type: Types.linear,
      property: Properties.opacity,
    },
    update: {
      type: Types.spring,
      springDamping: 0.4,
    },
  },
};

/**
 * Automatically animates views to their new positions when the
 * next layout happens.
 *
 * A common way to use this API is to call `LayoutAnimation.configureNext`
 * before calling `setState`.
 */
var LayoutAnimation = {
  /**
   * Schedules an animation to happen on the next layout.
   *
   * @param config Specifies animation properties:
   *
   *   - `duration` in milliseconds
   *   - `create`, config for animating in new views (see `Anim` type)
   *   - `update`, config for animating views that have been updated
   * (see `Anim` type)
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
  Types,
  Properties,
  configChecker: configChecker,
  Presets,
  easeInEaseOut: configureNext.bind(
    null, Presets.easeInEaseOut
  ),
  linear: configureNext.bind(
    null, Presets.linear
  ),
  spring: configureNext.bind(
    null, Presets.spring
  ),
};

module.exports = LayoutAnimation;
