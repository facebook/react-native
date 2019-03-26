/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReadableMap;

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

  /**
   * This method will get called when some of the configuration gets updated while the animation is
   * running. In that case animation should restart keeping its internal state to provide a smooth
   * transision. E.g. in case of a spring animation we want to keep the current value and speed and
   * start animating with the new properties (different destination or spring settings)
   */
  public void resetConfig(ReadableMap config) {
    throw new JSApplicationCausedNativeException(
            "Animation config for " + getClass().getSimpleName() + " cannot be reset");
  }
}
