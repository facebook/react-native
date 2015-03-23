/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Animation
 * @flow
 */
'use strict';

var RCTAnimationManager = require('NativeModules').AnimationManager;
var AnimationUtils = require('AnimationUtils');

type EasingFunction = (t: number) => number;

var Animation = {
  Mixin: require('AnimationMixin'),

  startAnimation: function(
    node: any,
    duration: number,
    delay: number,
    easing: (string | EasingFunction),
    properties: {[key: string]: any}
  ): number {
    var nodeHandle = +node.getNodeHandle();
    var easingSample = AnimationUtils.evaluateEasingFunction(duration, easing);
    var tag: number = RCTAnimationManager.startAnimation(nodeHandle, AnimationUtils.allocateTag(), duration, delay, easingSample, properties);
    return tag;
  },

  stopAnimation: function(tag: number) {
    RCTAnimationManager.stopAnimation(tag);
  },
};

module.exports = Animation;
