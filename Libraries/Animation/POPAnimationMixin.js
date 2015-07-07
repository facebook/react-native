/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule POPAnimationMixin
 * @flow
 */
'use strict';

var POPAnimationOrNull = require('POPAnimation');
var React = require('React');

if (!POPAnimationOrNull) {
  // POP animation isn't available in the OSS fork - this is a temporary
  // workaround to enable its availability to be determined at runtime.
  module.exports = (null : ?{});
} else {

// At this point, POPAnimationOrNull is guaranteed to be
// non-null. Bring it local to preserve type refinement.
var POPAnimation = POPAnimationOrNull;

var invariant = require('invariant');
var warning = require('warning');

var POPAnimationMixin = {
  /**
   * Different ways to interpolate between beginning and end states
   * of properties during animation, such as spring, linear, and decay.
   */
  AnimationTypes: POPAnimation.Types,
  AnimationProperties: POPAnimation.Properties,

  getInitialState: function(): Object {
    this._popAnimationEnqueuedAnimationTimeouts = [];
    return {
      _currentAnimationsByNodeHandle: {},
    };
  },

  _ensureBookkeepingSetup: function(nodeHandle: any) {
    if (!this.state._currentAnimationsByNodeHandle[nodeHandle]) {
      this.state._currentAnimationsByNodeHandle[nodeHandle] = [];
    }
  },

  /**
   * Start animating the View with ref `refKey`.
   *
   * @param {key} refKey The key to reference the View to be animated.
   *
   * @param {number|Object} anim Either the identifier returned by
   * POPAnimation.create* or an object defining all the necessary
   * properties of the animation you wish to start (including type, matching
   * an entry in AnimationTypes).
   *
   * @param {func} doneCallback A callback fired when the animation is done, and
   * is passed a `finished` param that indicates whether the animation
   * completely finished, or was interrupted.
   */
  startAnimation: function(
    refKey: string,
    anim: number | {type: number; property: number;},
    doneCallback: (finished: bool) => void
  ) {
    var animID: number = 0;
    if (typeof anim === 'number') {
      animID = anim;
    } else {
      invariant(
        anim instanceof Object &&
        anim.type !== undefined &&
        anim.property !== undefined,
        'Animation definitions must specify a type of animation and a ' +
        'property to animate.'
      );
      animID = POPAnimation.createAnimation(anim.type, anim);
    }
    invariant(
      this.refs[refKey],
      'Invalid refKey ' + refKey + ' for anim:\n' + JSON.stringify(anim) +
        '\nvalid refs: ' + JSON.stringify(Object.keys(this.refs))
    );
    var refNodeHandle = React.findNodeHandle(this.refs[refKey]);
    this.startAnimationWithNodeHandle(refNodeHandle, animID, doneCallback);
  },

  /**
   * Starts an animation on a native node.
   *
   * @param {NodeHandle} nodeHandle Handle to underlying native node.
   * @see `startAnimation`.
   */
  startAnimationWithNodeHandle: function(
    nodeHandle: any,
    animID: number,
    doneCallback: (finished: bool) => void
  ) {
    this._ensureBookkeepingSetup(nodeHandle);
    var animations = this.state._currentAnimationsByNodeHandle[nodeHandle];
    var animIndex = animations.length;
    animations.push(animID);
    var cleanupWrapper = (finished) => {
      if (!this.isMounted()) {
        return;
      }
      animations[animIndex] = 0; // zero it out so we don't try to stop it
      var allDone = true;
      for (var ii = 0; ii < animations.length; ii++) {
        if (animations[ii]) {
          allDone = false;
          break;
        }
      }
      if (allDone) {
        this.state._currentAnimationsByNodeHandle[nodeHandle] = undefined;
      }
      doneCallback && doneCallback(finished);
    };
    // Hack to aviod race condition in POP:
    var animationTimeoutHandler = setTimeout(() => {
      POPAnimation.addAnimation(nodeHandle, animID, cleanupWrapper);
    }, 1);
    this._popAnimationEnqueuedAnimationTimeouts.push(animationTimeoutHandler);
  },

  /**
   * Starts multiple animations with one shared callback that is called when all
   * animations complete.
   *
   * @param {Array(Object} animations Array of objects defining all the
   * animations to start, each with shape `{ref|nodeHandle, anim}`.
   * @param {func} onSuccess A callback fired when all animations have returned,
   * and is passed a finished arg that is true if all animations finished
   * completely.
   * @param {func} onFailure Not supported yet.
   */
  startAnimations: function(
    animations: Array<Object>,
    onSuccess: (finished: boolean) => void,
    onFailure: () => void
  ) {
    var numReturned = 0;
    var numFinished = 0;
    var numAnimations = animations.length;
    var metaCallback = (finished) => {
      if (finished) {
        ++numFinished;
      }
      if (++numReturned === numAnimations) {
        onSuccess && onSuccess(numFinished === numAnimations);
      }
    };
    animations.forEach((anim) => {
      warning(
        anim.ref != null || anim.nodeHandle != null &&
        !anim.ref !== !anim.nodeHandle,
        'Animations must be specified with either ref xor nodeHandle'
      );
      if (anim.ref) {
        this.startAnimation(anim.ref, anim.anim, metaCallback);
      } else if (anim.nodeHandle) {
        this.startAnimationWithNodeHandle(anim.nodeHandle, anim.anim, metaCallback);
      }
    });
  },

  /**
   * Stop any and all animations operating on the View with native node handle
   * `nodeHandle`.
   *
   * @param {NodeHandle} component The instance to stop animations
   * on. Do not pass a composite component.
   */
  stopNodeHandleAnimations: function(nodeHandle: any) {
    if (!this.state._currentAnimationsByNodeHandle[nodeHandle]) {
      return;
    }
    var anims = this.state._currentAnimationsByNodeHandle[nodeHandle];
    for (var i = 0; i < anims.length; i++) {
      var anim = anims[i];
      if (anim) {
        // Note: Converting the string key to a number `nodeHandle`.
        POPAnimation.removeAnimation(+nodeHandle, anim);
      }
    }
    this.state._currentAnimationsByNodeHandle[nodeHandle] = undefined;
  },

  /**
   * Stop any and all animations operating on the View with ref `refKey`.
   *
   * @param {key} refKey The key to reference the View to be animated.
   */
  stopAnimations: function(refKey: string) {
    invariant(this.refs[refKey], 'invalid ref');
    this.stopNodeHandleAnimations(React.findNodeHandle(this.refs[refKey]));
  },

  /**
   * Stop any and all animations created by this component on itself and
   * subviews.
   */
  stopAllAnimations: function() {
    for (var nodeHandle in this.state._currentAnimationsByNodeHandle) {
      this.stopNodeHandleAnimations(nodeHandle);
    }
  },

  /**
   * Animates size and position of a view referenced by `refKey` to a specific
   * frame.
   *
   * @param {key} refKey ref key for view to animate.
   * @param {Object} frame The frame to animate the view to, specified as {left,
   *        top, width, height}.
   * @param {const} type What type of interpolation to use, selected from
   *        `inperpolationTypes`.
   * @param {Object} event Event encapsulating synthetic and native data that
   *        may have triggered this animation.  Velocity is extracted from it if
   *        possible and applied to the animation.
   * @param {func} doneCallback A callback fired when the animation is done, and
   *        is passed a `finished` param that indicates whether the animation
   *        completely finished, or was interrupted.
   */
  animateToFrame: function(
    refKey: string,
    frame: {left: number; top: number; width: number; height: number;},
    type: number,
    velocity: number,
    doneCallback: (finished: boolean) => void
  ) {
    var animFrame = { // Animations use a centered coordinate system.
      x: frame.left + frame.width / 2,
      y: frame.top + frame.height / 2,
      w: frame.width,
      h: frame.height
    };
    var posAnim = POPAnimation.createAnimation(type, {
      property: POPAnimation.Properties.position,
      toValue: [animFrame.x, animFrame.y],
      velocity: velocity || [0, 0],
    });
    var sizeAnim = POPAnimation.createAnimation(type, {
      property: POPAnimation.Properties.size,
      toValue: [animFrame.w, animFrame.h]
    });
    this.startAnimation(refKey, posAnim, doneCallback);
    this.startAnimation(refKey, sizeAnim);
  },

  // Cleanup any potentially leaked animations.
  componentWillUnmount: function() {
    this.stopAllAnimations();
    this._popAnimationEnqueuedAnimationTimeouts.forEach(animationTimeoutHandler => {
      clearTimeout(animationTimeoutHandler);
    });
    this._popAnimationEnqueuedAnimationTimeouts = [];
  }
};

module.exports = POPAnimationMixin;

}
