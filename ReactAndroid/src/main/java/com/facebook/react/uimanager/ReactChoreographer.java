/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.ArrayDeque;

import android.view.Choreographer;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;

/**
 * A simple wrapper around Choreographer that allows us to control the order certain callbacks
 * are executed within a given frame. The main difference is that we enforce this is accessed from
 * the UI thread: this is because this ordering cannot be guaranteed across multiple threads.
 */
public class ReactChoreographer {

  /**
   * For use by perf markers that need to happen immediately after draw
   */
  public static final int CALLBACK_TYPE_PERF_MARKERS = 0;

  /**
   * For use by {@link com.facebook.react.uimanager.UIManagerModule}
   */
  public static final int CALLBACK_TYPE_DISPATCH_UI = 1;

  /**
   * Events that make JS do things.
   */
  public static final int CALLBACK_TYPE_TIMERS_EVENTS = 2;

  private static final int CALLBACK_TYPE_COUNT = CALLBACK_TYPE_TIMERS_EVENTS + 1;

  private static ReactChoreographer sInstance;

  public static ReactChoreographer getInstance() {
    UiThreadUtil.assertOnUiThread();
    if (sInstance == null) {
      sInstance = new ReactChoreographer();
    }
    return sInstance;
  }

  private final Choreographer mChoreographer;
  private final ReactChoreographerDispatcher mReactChoreographerDispatcher;
  private final ArrayDeque<Choreographer.FrameCallback>[] mCallbackQueues;

  private int mTotalCallbacks = 0;
  private boolean mHasPostedCallback = false;

  private ReactChoreographer() {
    mChoreographer = Choreographer.getInstance();
    mReactChoreographerDispatcher = new ReactChoreographerDispatcher();
    mCallbackQueues = new ArrayDeque[CALLBACK_TYPE_COUNT];
    for (int i = 0; i < mCallbackQueues.length; i++) {
      mCallbackQueues[i] = new ArrayDeque<>();
    }
  }

  public void postFrameCallback(int type, Choreographer.FrameCallback frameCallback) {
    UiThreadUtil.assertOnUiThread();
    mCallbackQueues[type].addLast(frameCallback);
    mTotalCallbacks++;
    Assertions.assertCondition(mTotalCallbacks > 0);
    if (!mHasPostedCallback) {
      mChoreographer.postFrameCallback(mReactChoreographerDispatcher);
      mHasPostedCallback = true;
    }
  }

  public void removeFrameCallback(int type, Choreographer.FrameCallback frameCallback) {
    UiThreadUtil.assertOnUiThread();
    if (mCallbackQueues[type].removeFirstOccurrence(frameCallback)) {
      mTotalCallbacks--;
      maybeRemoveFrameCallback();
    } else {
      FLog.e(ReactConstants.TAG, "Tried to remove non-existent frame callback");
    }
  }

  private void maybeRemoveFrameCallback() {
    Assertions.assertCondition(mTotalCallbacks >= 0);
    if (mTotalCallbacks == 0 && mHasPostedCallback) {
      mChoreographer.removeFrameCallback(mReactChoreographerDispatcher);
      mHasPostedCallback = false;
    }
  }

  private class ReactChoreographerDispatcher implements Choreographer.FrameCallback {

    @Override
    public void doFrame(long frameTimeNanos) {
      mHasPostedCallback = false;
      for (int i = 0; i < mCallbackQueues.length; i++) {
        int initialLength = mCallbackQueues[i].size();
        for (int callback = 0; callback < initialLength; callback++) {
          mCallbackQueues[i].removeFirst().doFrame(frameTimeNanos);
          mTotalCallbacks--;
        }
      }
      maybeRemoveFrameCallback();
    }
  }
}
