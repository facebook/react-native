/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableMap;

/**
 * Implementation of {@link AnimationDriver} providing support for decay animations. The
 * implementation is copied from the JS version in {@code AnimatedImplementation.js}.
 */
public class DecayAnimation extends AnimationDriver {

  private final double mVelocity;
  private final double mDeceleration;

  private long mStartFrameTimeMillis = -1;
  private double mFromValue = 0d;
  private double mLastValue = 0d;
  private int mIterations;
  private int mCurrentLoop;

  public DecayAnimation(ReadableMap config) {
    mVelocity = config.getDouble("velocity");
    mDeceleration = config.getDouble("deceleration");
    mIterations = config.hasKey("iterations") ? config.getInt("iterations") : 1;
    mCurrentLoop = 1;
    mHasFinished = mIterations == 0;
  }

  @Override
  public void runAnimationStep(long frameTimeNanos) {
    long frameTimeMillis = frameTimeNanos / 1000000;
    if (mStartFrameTimeMillis == -1) {
      // since this is the first animation step, consider the start to be on the previous frame
      mStartFrameTimeMillis = frameTimeMillis - 16;
      if (mFromValue == mLastValue) { // first iteration, assign mFromValue based on mAnimatedValue
        mFromValue = mAnimatedValue.mValue;
      } else { // not the first iteration, reset mAnimatedValue based on mFromValue
        mAnimatedValue.mValue = mFromValue;
      }
      mLastValue = mAnimatedValue.mValue;
    }

    final double value = mFromValue +
      (mVelocity / (1 - mDeceleration)) *
        (1 - Math.exp(-(1 - mDeceleration) * (frameTimeMillis - mStartFrameTimeMillis)));

    if (Math.abs(mLastValue - value) < 0.1) {

      if (mIterations == -1 || mCurrentLoop < mIterations) { // looping animation, return to start
        // set mStartFrameTimeMillis to -1 to reset instance variables on the next runAnimationStep
        mStartFrameTimeMillis = -1;
        mCurrentLoop++;
      } else { // animation has completed
        mHasFinished = true;
        return;
      }
    }

    mLastValue = value;
    mAnimatedValue.mValue = value;
  }
}
