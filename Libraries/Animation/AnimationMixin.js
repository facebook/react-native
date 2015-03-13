/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AnimationMixin
 * @flow
 */
'use strict';

var AnimationUtils = require('AnimationUtils');
var { RCTAnimationManager } = require('NativeModules');

var invariant = require('invariant');

type EasingFunction = (t: number) => number;

var AnimationMixin = {
  getInitialState: function(): Object {
    return {};
  },

  startAnimation: function(
    refKey: string,
    duration: number,
    delay: number,
    easing: (string | EasingFunction),
    properties: {[key: string]: any}
  ): number {
    var ref = this.refs[refKey];
    invariant(
      ref,
      'Invalid refKey ' + refKey + '; ' +
      'valid refs: ' + JSON.stringify(Object.keys(this.refs))
    );

    var nodeHandle = +ref.getNodeHandle();
    var easingSample = AnimationUtils.evaluateEasingFunction(duration, easing);
    var tag: number = RCTAnimationManager.startAnimation(nodeHandle, AnimationUtils.allocateTag(), duration, delay, easingSample, properties);
    return tag;
  },

  stopAnimation: function(tag: number) {
    RCTAnimationManager.stopAnimation(tag);
  },
};

module.exports = AnimationMixin;
