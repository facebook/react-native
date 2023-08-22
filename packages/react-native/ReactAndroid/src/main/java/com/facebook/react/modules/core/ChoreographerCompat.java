/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file was pulled from the facebook/rebound repository.

package com.facebook.react.modules.core;

import android.os.Handler;
import android.view.Choreographer;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * Wrapper class for abstracting away availability of the JellyBean Choreographer. If Choreographer
 * is unavailable we fallback to using a normal Handler.
 */
public class ChoreographerCompat {

  private static final long ONE_FRAME_MILLIS = 17;
  private static ChoreographerCompat sInstance;

  private Handler mHandler;
  private Choreographer mChoreographer;

  public static ChoreographerCompat getInstance() {
    UiThreadUtil.assertOnUiThread();
    if (sInstance == null) {
      sInstance = new ChoreographerCompat();
    }
    return sInstance;
  }

  private ChoreographerCompat() {
    mChoreographer = getChoreographer();
  }

  public void postFrameCallback(FrameCallback callbackWrapper) {
    choreographerPostFrameCallback(callbackWrapper.getFrameCallback());
  }

  public void postFrameCallbackDelayed(FrameCallback callbackWrapper, long delayMillis) {
    choreographerPostFrameCallbackDelayed(callbackWrapper.getFrameCallback(), delayMillis);
  }

  public void removeFrameCallback(FrameCallback callbackWrapper) {
    choreographerRemoveFrameCallback(callbackWrapper.getFrameCallback());
  }

  private Choreographer getChoreographer() {
    return Choreographer.getInstance();
  }

  private void choreographerPostFrameCallback(Choreographer.FrameCallback frameCallback) {
    mChoreographer.postFrameCallback(frameCallback);
  }

  private void choreographerPostFrameCallbackDelayed(
      Choreographer.FrameCallback frameCallback, long delayMillis) {
    mChoreographer.postFrameCallbackDelayed(frameCallback, delayMillis);
  }

  private void choreographerRemoveFrameCallback(Choreographer.FrameCallback frameCallback) {
    mChoreographer.removeFrameCallback(frameCallback);
  }

  /**
   * This class provides a compatibility wrapper around the JellyBean FrameCallback with methods to
   * access cached wrappers for submitting a real FrameCallback to a Choreographer or a Runnable to
   * a Handler.
   */
  public abstract static class FrameCallback {

    private Runnable mRunnable;
    private Choreographer.FrameCallback mFrameCallback;

    Choreographer.FrameCallback getFrameCallback() {
      if (mFrameCallback == null) {
        mFrameCallback =
            new Choreographer.FrameCallback() {
              @Override
              public void doFrame(long frameTimeNanos) {
                FrameCallback.this.doFrame(frameTimeNanos);
              }
            };
      }
      return mFrameCallback;
    }

    Runnable getRunnable() {
      if (mRunnable == null) {
        mRunnable =
            new Runnable() {
              @Override
              public void run() {
                doFrame(System.nanoTime());
              }
            };
      }
      return mRunnable;
    }

    /**
     * Just a wrapper for frame callback, see {@link
     * android.view.Choreographer.FrameCallback#doFrame(long)}.
     */
    public abstract void doFrame(long frameTimeNanos);
  }
}
