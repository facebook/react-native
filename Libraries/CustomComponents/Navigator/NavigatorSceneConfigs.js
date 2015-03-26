/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigatorSceneConfigs
 */
'use strict';

var Dimensions = require('Dimensions');
var PixelRatio = require('PixelRatio');

var buildStyleInterpolator = require('buildStyleInterpolator');
var merge = require('merge');

var SCREEN_WIDTH = Dimensions.get('window').width;
var SCREEN_HEIGHT = Dimensions.get('window').height;

var ToTheLeft = {
  // Rotate *requires* you to break out each individual component of
  // rotation (x, y, z, w)
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: -Math.round(Dimensions.get('window').width * 0.3), y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  // Uncomment to try rotation:
  // Quick guide to reasoning about rotations:
  // http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-17-quaternions/#Quaternions
  // transformRotateRadians: {
  //   from: {x: 0, y: 0, z: 0, w: 1},
  //   to: {x: 0, y: 0, z: -0.47, w: 0.87},
  //   min: 0,
  //   max: 1,
  //   type: 'linear',
  //   extrapolate: true
  // },
  transformScale: {
    from: {x: 1, y: 1, z: 1},
    to: {x: 0.95, y: 0.95, z: 1},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true
  },
  opacity: {
    from: 1,
    to: 0.3,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
  translateX: {
    from: 0,
    to: -Math.round(Dimensions.get('window').width * 0.3),
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  scaleX: {
    from: 1,
    to: 0.95,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true
  },
  scaleY: {
    from: 1,
    to: 0.95,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true
  },
};

var FromTheRight = {
  opacity: {
    value: 1.0,
    type: 'constant',
  },

  transformTranslate: {
    from: {x: Dimensions.get('window').width, y: 0, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },

  translateX: {
    from: Dimensions.get('window').width,
    to: 0,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },

  scaleX: {
    value: 1,
    type: 'constant',
  },
  scaleY: {
    value: 1,
    type: 'constant',
  },
};


var ToTheBack = {
  // Rotate *requires* you to break out each individual component of
  // rotation (x, y, z, w)
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  transformScale: {
    from: {x: 1, y: 1, z: 1},
    to: {x: 0.95, y: 0.95, z: 1},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true
  },
  opacity: {
    from: 1,
    to: 0.3,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
  scaleX: {
    from: 1,
    to: 0.95,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true
  },
  scaleY: {
    from: 1,
    to: 0.95,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true
  },
};

var FromTheFront = {
  opacity: {
    value: 1.0,
    type: 'constant',
  },

  transformTranslate: {
    from: {x: 0, y: Dimensions.get('window').height, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  translateY: {
    from: Dimensions.get('window').height,
    to: 0,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  scaleX: {
    value: 1,
    type: 'constant',
  },
  scaleY: {
    value: 1,
    type: 'constant',
  },
};


var Interpolators = {
  Vertical: {
    into: buildStyleInterpolator(FromTheFront),
    out: buildStyleInterpolator(ToTheBack),
  },
  Horizontal: {
    into: buildStyleInterpolator(FromTheRight),
    out: buildStyleInterpolator(ToTheLeft),
  },
};


// These are meant to mimic iOS default behavior
var PastPointOfNoReturn = {
  horizontal: function(location) {
    return location > SCREEN_WIDTH * 3 / 5;
  },
  vertical: function(location) {
    return location > SCREEN_HEIGHT * 3 / 5;
  },
};

var BaseConfig = {
  // When false, all gestures are ignored for this scene
  enableGestures: true,

  // How far the swipe must drag to start transitioning
  gestureDetectMovement: 2,

  // Amplitude of release velocity that is considered still
  notMoving: 0.3,

  // Velocity to start at when transitioning without gesture
  defaultTransitionVelocity: 1.5,

  // Fraction of directional move required.
  directionRatio: 0.66,

  // Velocity to transition with when the gesture release was "not moving"
  snapVelocity: 2,

  // Rebound spring parameters when transitioning FROM this scene
  springFriction: 26,
  springTension: 200,

  // Defaults for horizontal transitioning:

  isVertical: false,
  screenDimension: SCREEN_WIDTH,

  // Region that can trigger swipe. iOS default is 30px from the left edge
  edgeHitWidth: 30,

  // Point at which a non-velocity release will cause nav pop
  pastPointOfNoReturn: PastPointOfNoReturn.horizontal,

  // Animation interpolators for this transition
  interpolators: Interpolators.Horizontal,
};

var NavigatorSceneConfigs = {
  PushFromRight: merge(BaseConfig, {
    // We will want to customize this soon
  }),
  FloatFromRight: merge(BaseConfig, {
    // We will want to customize this soon
  }),
  FloatFromBottom: merge(BaseConfig, {
    edgeHitWidth: 150,
    interpolators: Interpolators.Vertical,
    isVertical: true,
    pastPointOfNoReturn: PastPointOfNoReturn.vertical,
    screenDimension: SCREEN_HEIGHT,
  }),
};

module.exports = NavigatorSceneConfigs;
