/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule LayoutAnimation
 */
'use strict';

var PropTypes = require('ReactPropTypes');
var RKUIManager = require('NativeModules').RKUIManager;

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var keyMirror = require('keyMirror');

var Types = keyMirror({
  spring: true,
  linear: true,
  easeInEaseOut: true,
  easeIn: true,
  easeOut: true,
});

var Properties = keyMirror({
  opacity: true,
  scaleXY: true,
});

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

var configChecker = createStrictShapeTypeChecker({
  duration: PropTypes.number.isRequired,
  create: animChecker,
  update: animChecker,
  delete: animChecker,
});

var LayoutAnimation = {
  configureNext(config, onAnimationDidEnd, onError) {
    configChecker({config}, 'config', 'LayoutAnimation.configureNext');
    RKUIManager.configureNextLayoutAnimation(config, onAnimationDidEnd, onError);
  },
  create(duration, type, creationProp) {
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
  },
  Types: Types,
  Properties: Properties,
  configChecker: configChecker,
};

LayoutAnimation.Presets = {
  easeInEaseOut: LayoutAnimation.create(
    0.3, Types.easeInEaseOut, Properties.opacity
  ),
  linear: LayoutAnimation.create(
    0.5, Types.linear, Properties.opacity
  ),
  spring: {
    duration: 0.7,
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

module.exports = LayoutAnimation;
