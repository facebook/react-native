/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AnimationExperimental
 */
'use strict';

var RCTAnimationManager = require('NativeModules').AnimationExperimentalManager;
if (!RCTAnimationManager) {
  // AnimationExperimental isn't available internally - this is a temporary
  // workaround to enable its availability to be determined at runtime.
  // For Flow let's pretend like we always export AnimationExperimental
  // so all our users don't need to do null checks
  module.exports = null;
} else {

var React = require('React');
var AnimationUtils = require('AnimationUtils');

type EasingFunction = (t: number) => number;

var Properties = {
  opacity: true,
  position: true,
  positionX: true,
  positionY: true,
  rotation: true,
  scaleXY: true,
};

type ValueType = number | Array<number> | {[key: string]: number};

/**
 * This is an experimental module that is under development, incomplete,
 * potentially buggy, not used in any production apps, and will probably change
 * in non-backward compatible ways.
 *
 * Use at your own risk.
 */
var AnimationExperimental = {
  startAnimation: function(
    anim: {
      node: any;
      duration: number;
      easing: ($Enum<typeof AnimationUtils.Defaults> | EasingFunction);
      property: $Enum<typeof Properties>;
      toValue: ValueType;
      fromValue?: ValueType;
      delay?: number;
    },
    callback?: ?(finished: bool) => void
  ): number {
    var nodeHandle = React.findNodeHandle(anim.node);
    var easingSample = AnimationUtils.evaluateEasingFunction(
      anim.duration,
      anim.easing
    );
    var tag: number = AnimationUtils.allocateTag();
    var props = {};
    props[anim.property] = {to: anim.toValue};
    RCTAnimationManager.startAnimation(
      nodeHandle,
      tag,
      anim.duration,
      anim.delay,
      easingSample,
      props,
      callback
    );
    return tag;
  },

  stopAnimation: function(tag: number) {
    RCTAnimationManager.stopAnimation(tag);
  },
};

if (__DEV__) {
  if (RCTAnimationManager && RCTAnimationManager.Properties) {
    var a = Object.keys(Properties);
    var b = RCTAnimationManager.Properties;
    var diff = a.filter((i) => b.indexOf(i) < 0).concat(
      b.filter((i) => a.indexOf(i) < 0)
    );
    if (diff.length > 0) {
      throw new Error('JS animation properties don\'t match native properties.' +
        JSON.stringify(diff, null, '  '));
    }
  }
}

module.exports = AnimationExperimental;

}
