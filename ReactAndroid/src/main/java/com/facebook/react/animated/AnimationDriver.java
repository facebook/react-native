/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.Callback;

/**
 * Base class for different types of animation drivers. Can be used to implement simple time-based
 * animations as well as spring based animations.
 */
/*package*/ abstract class AnimationDriver {

  /*package*/ boolean mHasFinished = false;
  /*package*/ ValueAnimatedNode mAnimatedValue;
  /*package*/ Callback mEndCallback;
  /*package*/ int mId;

  /**
   * This method gets called in the main animation loop with a frame time passed down from the
   * android choreographer callback.
   */
  public abstract void runAnimationStep(long frameTimeNanos);
}
