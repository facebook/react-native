/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

/**
 * Implementation of {@link AnimationDriver} which provides a support for simple time-based
 * animations that are pre-calculate on the JS side. For each animation frame JS provides a value
 * from 0 to 1 that indicates a progress of the animation at that frame.
 */
class FrameBasedAnimationDriver extends AnimationDriver {

  // 60FPS
  private static final double FRAME_TIME_MILLIS = 1000d / 60d;

  private long mStartFrameTimeNanos;
  private double[] mFrames;
  private double mToValue;
  private double mFromValue;
  private int mIterations;
  private int mCurrentLoop;

  FrameBasedAnimationDriver(ReadableMap config) {
    resetConfig(config);
  }

  @Override
  public void resetConfig(ReadableMap config) {
    ReadableArray frames = config.getArray("frames");
    int numberOfFrames = frames.size();
    if (mFrames == null || mFrames.length != numberOfFrames) {
      mFrames = new double[numberOfFrames];
    }
    for (int i = 0; i < numberOfFrames; i++) {
      mFrames[i] = frames.getDouble(i);
    }
    if(config.hasKey("toValue")) {
      mToValue = config.getType("toValue") == ReadableType.Number ? config.getDouble("toValue") : 0;
    } else {
      mToValue = 0;
    }
    if(config.hasKey("iterations")) {
      mIterations = config.getType("iterations") == ReadableType.Number ?
                                                    config.getInt("iterations") : 1;
    } else {
      mIterations = 1;
    }
    mCurrentLoop = 1;
    mHasFinished = mIterations == 0;
    mStartFrameTimeNanos = -1;
  }

  @Override
  public void runAnimationStep(long frameTimeNanos) {
    if (mStartFrameTimeNanos < 0) {
      mStartFrameTimeNanos = frameTimeNanos;
      if (mCurrentLoop == 1) {
        // initiate start value when animation runs for the first time
        mFromValue = mAnimatedValue.mValue;
      }
    }
    long timeFromStartMillis = (frameTimeNanos - mStartFrameTimeNanos) / 1000000;
    int frameIndex = (int) Math.round(timeFromStartMillis / FRAME_TIME_MILLIS);
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
        mStartFrameTimeNanos = -1;
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
