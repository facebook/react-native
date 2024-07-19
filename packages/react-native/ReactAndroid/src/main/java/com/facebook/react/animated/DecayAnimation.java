/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableMap;

/**
 * Implementation of {@link AnimationDriver} providing support for decay animations. The
 * implementation is copied from the JS version in {@code AnimatedImplementation.js}.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class DecayAnimation extends AnimationDriver {

  private final double mVelocity;

  private double mDeceleration;
  private long mStartFrameTimeMillis;
  private double mFromValue;
  private double mLastValue;
  private int mIterations;
  private int mCurrentLoop;

  public DecayAnimation(ReadableMap config) {
    mVelocity = config.getDouble("velocity"); // initial velocity
    resetConfig(config);
  }

  @Override
  public void resetConfig(ReadableMap config) {
    mDeceleration = config.getDouble("deceleration");
    mIterations = config.hasKey("iterations") ? config.getInt("iterations") : 1;
    mCurrentLoop = 1;
    mHasFinished = mIterations == 0;
    mStartFrameTimeMillis = -1;
    mFromValue = 0;
    mLastValue = 0;
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

    final double value =
        mFromValue
            + (mVelocity / (1 - mDeceleration))
                * (1 - Math.exp(-(1 - mDeceleration) * (frameTimeMillis - mStartFrameTimeMillis)));

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
