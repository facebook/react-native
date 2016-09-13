/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule NavigatorSceneConfigs
 */
'use strict';

var Dimensions = require('Dimensions');
var PixelRatio = require('PixelRatio');
var I18nManager = require('I18nManager');

var buildStyleInterpolator = require('buildStyleInterpolator');

var IS_RTL = I18nManager.isRTL;

var SCREEN_WIDTH = Dimensions.get('window').width;
var SCREEN_HEIGHT = Dimensions.get('window').height;

var ToTheLeftIOS = {
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: -SCREEN_WIDTH * 0.3, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  opacity: {
    value: 1.0,
    type: 'constant',
  },
};

var ToTheRightIOS = {
  ...ToTheLeftIOS,
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: SCREEN_WIDTH * 0.3, y: 0, z: 0},
  },
};

var FadeToTheLeft = {
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

var FadeToTheRight = {
  ...FadeToTheLeft,
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: Math.round(SCREEN_WIDTH * 0.3), y: 0, z: 0},
  },
  translateX: {
    from: 0,
    to: Math.round(SCREEN_WIDTH * 0.3),
  },
};

var FadeIn = {
  opacity: {
    from: 0,
    to: 1,
    min: 0.5,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
};

var FadeOut = {
  opacity: {
    from: 1,
    to: 0,
    min: 0,
    max: 0.5,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
};

var ToTheLeft = {
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: -Dimensions.get('window').width, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  opacity: {
    value: 1.0,
    type: 'constant',
  },

  translateX: {
    from: 0,
    to: -Dimensions.get('window').width,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
};

var ToTheRight = {
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: Dimensions.get('window').width, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  opacity: {
    value: 1.0,
    type: 'constant',
  },

  translateX: {
    from: 0,
    to: Dimensions.get('window').width,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
};

var ToTheUp = {
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: 0, y: -Dimensions.get('window').height, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  opacity: {
    value: 1.0,
    type: 'constant',
  },
  translateY: {
    from: 0,
    to: -Dimensions.get('window').height,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
};

var ToTheDown = {
  transformTranslate: {
    from: {x: 0, y: 0, z: 0},
    to: {x: 0, y: Dimensions.get('window').height, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  opacity: {
    value: 1.0,
    type: 'constant',
  },
  translateY: {
    from: 0,
    to: Dimensions.get('window').height,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
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

var FromTheLeft = {
  ...FromTheRight,
  transformTranslate: {
    from: {x: -SCREEN_WIDTH, y: 0, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  translateX: {
    from: -SCREEN_WIDTH,
    to: 0,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
};

var FromTheDown = {
  ...FromTheRight,
  transformTranslate: {
    from: {y: SCREEN_HEIGHT, x: 0, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  translateY: {
    from: SCREEN_HEIGHT,
    to: 0,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
};

var FromTheTop = {
  ...FromTheRight,
  transformTranslate: {
    from: {y: -SCREEN_HEIGHT, x: 0, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  translateY: {
    from: -SCREEN_HEIGHT,
    to: 0,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
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

var ToTheBackAndroid = {
  opacity: {
    value: 1,
    type: 'constant',
  },
};

var FromTheFrontAndroid = {
  opacity: {
    from: 0,
    to: 1,
    min: 0.5,
    max: 1,
    type: 'linear',
    extrapolate: false,
    round: 100,
  },
  transformTranslate: {
    from: {x: 0, y: 100, z: 0},
    to: {x: 0, y: 0, z: 0},
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
  translateY: {
    from: 100,
    to: 0,
    min: 0,
    max: 1,
    type: 'linear',
    extrapolate: true,
    round: PixelRatio.get(),
  },
};

var BaseOverswipeConfig = {
  frictionConstant: 1,
  frictionByDistance: 1.5,
};

var BaseLeftToRightGesture = {

  // If the gesture can end and restart during one continuous touch
  isDetachable: false,

  // How far the swipe must drag to start transitioning
  gestureDetectMovement: 2,

  // Amplitude of release velocity that is considered still
  notMoving: 0.3,

  // Fraction of directional move required.
  directionRatio: 0.66,

  // Velocity to transition with when the gesture release was "not moving"
  snapVelocity: 2,

  // Region that can trigger swipe. iOS default is 30px from the left edge
  edgeHitWidth: 30,

  // Ratio of gesture completion when non-velocity release will cause action
  stillCompletionRatio: 3 / 5,

  fullDistance: SCREEN_WIDTH,

  direction: 'left-to-right',

};

var BaseRightToLeftGesture = {
  ...BaseLeftToRightGesture,
  direction: 'right-to-left',
};

var BaseDownUpGesture = {
  ...BaseLeftToRightGesture,
  fullDistance: SCREEN_HEIGHT,
  direction: 'down-to-up',
};

var BaseUpDownGesture = {
  ...BaseLeftToRightGesture,
  fullDistance: SCREEN_HEIGHT,
  direction: 'up-to-down',
};

// For RTL experiment, we need to swap all the Left and Right gesture and animation.
// So we create a direction mapping for both LTR and RTL, and change left/right to start/end.
let directionMapping = {
  ToTheStartIOS: ToTheLeftIOS,
  ToTheEndIOS: ToTheRightIOS,
  FadeToTheStart: FadeToTheLeft,
  FadeToTheEnd: FadeToTheRight,
  ToTheStart: ToTheLeft,
  ToTheEnd: ToTheRight,
  FromTheStart: FromTheLeft,
  FromTheEnd: FromTheRight,
  BaseStartToEndGesture: BaseLeftToRightGesture,
  BaseEndToStartGesture: BaseRightToLeftGesture,
};

if (IS_RTL) {
  directionMapping = {
    ToTheStartIOS: ToTheRightIOS,
    ToTheEndIOS: ToTheLeftIOS,
    FadeToTheStart: FadeToTheRight,
    FadeToTheEnd: FadeToTheLeft,
    ToTheStart: ToTheRight,
    ToTheEnd: ToTheLeft,
    FromTheStart: FromTheRight,
    FromTheEnd: FromTheLeft,
    BaseStartToEndGesture: BaseRightToLeftGesture,
    BaseEndToStartGesture: BaseLeftToRightGesture,
  };
}

var BaseConfig = {
  // A list of all gestures that are enabled on this scene
  gestures: {
    pop: directionMapping.BaseStartToEndGesture,
  },

  // Rebound spring parameters when transitioning FROM this scene
  springFriction: 26,
  springTension: 200,

  // Velocity to start at when transitioning without gesture
  defaultTransitionVelocity: 1.5,

  // Animation interpolators for horizontal transitioning:
  animationInterpolators: {
    into: buildStyleInterpolator(directionMapping.FromTheEnd),
    out: buildStyleInterpolator(directionMapping.FadeToTheStart),
  },
};

var NavigatorSceneConfigs = {
  PushFromRight: {
    ...BaseConfig,
    animationInterpolators: {
      into: buildStyleInterpolator(directionMapping.FromTheEnd),
      out: buildStyleInterpolator(directionMapping.ToTheStartIOS),
    },
  },
  PushFromLeft: {
    ...BaseConfig,
    animationInterpolators: {
      into: buildStyleInterpolator(directionMapping.FromTheStart),
      out: buildStyleInterpolator(directionMapping.ToTheEndIOS),
    },
  },
  FloatFromRight: {
    ...BaseConfig,
    // We will want to customize this soon
  },
  FloatFromLeft: {
    ...BaseConfig,
    gestures: {
      pop: directionMapping.BaseEndToStartGesture,
    },
    animationInterpolators: {
      into: buildStyleInterpolator(directionMapping.FromTheStart),
      out: buildStyleInterpolator(directionMapping.FadeToTheEnd),
    },
  },
  FloatFromBottom: {
    ...BaseConfig,
    gestures: {
      pop: {
        ...directionMapping.BaseStartToEndGesture,
        edgeHitWidth: 150,
        direction: 'top-to-bottom',
        fullDistance: SCREEN_HEIGHT,
      }
    },
    animationInterpolators: {
      into: buildStyleInterpolator(FromTheFront),
      out: buildStyleInterpolator(ToTheBack),
    },
  },
  FloatFromBottomAndroid: {
    ...BaseConfig,
    gestures: null,
    defaultTransitionVelocity: 3,
    springFriction: 20,
    animationInterpolators: {
      into: buildStyleInterpolator(FromTheFrontAndroid),
      out: buildStyleInterpolator(ToTheBackAndroid),
    },
  },
  FadeAndroid: {
    ...BaseConfig,
    gestures: null,
    animationInterpolators: {
      into: buildStyleInterpolator(FadeIn),
      out: buildStyleInterpolator(FadeOut),
    },
  },
  HorizontalSwipeJump: {
    ...BaseConfig,
    gestures: {
      jumpBack: {
        ...directionMapping.BaseStartToEndGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
      jumpForward: {
        ...directionMapping.BaseEndToStartGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
    },
    animationInterpolators: {
      into: buildStyleInterpolator(directionMapping.FromTheEnd),
      out: buildStyleInterpolator(directionMapping.ToTheStart),
    },
  },
  HorizontalSwipeJumpFromRight: {
    ...BaseConfig,
    gestures: {
      jumpBack: {
        ...directionMapping.BaseEndToStartGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
      jumpForward: {
        ...directionMapping.BaseStartToEndGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
      pop: directionMapping.BaseEndToStartGesture,
    },
    animationInterpolators: {
      into: buildStyleInterpolator(directionMapping.FromTheStart),
      out: buildStyleInterpolator(directionMapping.FadeToTheEnd),
    },
  },
  VerticalUpSwipeJump: {
    ...BaseConfig,
    gestures: {
      jumpBack: {
        ...BaseDownUpGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
      jumpForward: {
        ...BaseDownUpGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
    },
    animationInterpolators: {
      into: buildStyleInterpolator(FromTheDown),
      out: buildStyleInterpolator(ToTheUp),
    },
  },
  VerticalDownSwipeJump: {
    ...BaseConfig,
    gestures: {
      jumpBack: {
        ...BaseUpDownGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
      jumpForward: {
        ...BaseUpDownGesture,
        overswipe: BaseOverswipeConfig,
        edgeHitWidth: null,
        isDetachable: true,
      },
    },
    animationInterpolators: {
      into: buildStyleInterpolator(FromTheTop),
      out: buildStyleInterpolator(ToTheDown),
    },
  },
};

module.exports = NavigatorSceneConfigs;
