/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Implementation of {@link AnimationDriver} which provides a support for simple time-based
 * animations that are pre-calculate on the JS side. For each animation frame JS provides a value
 * from 0 to 1 that indicates a progress of the animation at that frame.
 */
class FrameBasedAnimationDriver extends AnimationDriver {

  // 60FPS
  private static final double FRAME_TIME_MILLIS = 1000d / 60d;

  private long mStartFrameTimeNanos = -1;
  private final double[] mFrames;
  private final double mToValue;
  private double mFromValue;
  private int mIterations;
  private int mCurrentLoop;

  FrameBasedAnimationDriver(ReadableMap config) {
    ReadableArray frames = config.getArray("frames");
    int numberOfFrames = frames.size();
    mFrames = new double[numberOfFrames];
    for (int i = 0; i < numberOfFrames; i++) {
      mFrames[i] = frames.getDouble(i);
    }
    mToValue = config.getDouble("toValue");
    mIterations = config.hasKey("iterations") ? config.getInt("iterations") : 1;
    mCurrentLoop = 1;
    mHasFinished = mIterations == 0;
  }

  @Override
  public void runAnimationStep(long frameTimeNanos) {
    if (mStartFrameTimeNanos < 0) {
      mStartFrameTimeNanos = frameTimeNanos;
      mFromValue = mAnimatedValue.mValue;
    }
    long timeFromStartMillis = (frameTimeNanos - mStartFrameTimeNanos) / 1000000;
    int frameIndex = (int) (timeFromStartMillis / FRAME_TIME_MILLIS);
    if (frameIndex < 0) {
      throw new IllegalStateException("Calculated frame index should never be lower than 0");
    } else if (mHasFinished) {
      // nothing to do here
      return;
    }
    double nextValue;
    if (frameIndex >= mFrames.length - 1) {
      nextValue = mToValue;
      if (mIterations == -1 || mCurrentLoop < mIterations) { // looping animation, return to start
        mStartFrameTimeNanos = frameTimeNanos;
        mCurrentLoop++;
      } else { // animation has completed, no more frames left
        mHasFinished = true;
      }
    } else {
      nextValue = mFromValue + mFrames[frameIndex] * (mToValue - mFromValue);
    }
    mAnimatedValue.mValue = nextValue;
  }
}
