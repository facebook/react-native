/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import com.facebook.react.bridge.UiThreadUtil;
import java.util.ArrayDeque;
import javax.annotation.Nullable;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;

/**
 * A simple wrapper around Choreographer that allows us to control the order certain callbacks
 * are executed within a given frame. The main difference is that we enforce this is accessed from
 * the UI thread: this is because this ordering cannot be guaranteed across multiple threads.
 */
public class ReactChoreographer {

  public enum CallbackType {

    /**
     * For use by perf markers that need to happen immediately after draw
     */
    PERF_MARKERS(0),

    /**
     * For use by {@link com.facebook.react.uimanager.UIManagerModule}
     */
    DISPATCH_UI(1),

    /**
     * For use by {@link com.facebook.react.animated.NativeAnimatedModule}
     */
    NATIVE_ANIMATED_MODULE(2),

    /**
     * Events that make JS do things.
     */
    TIMERS_EVENTS(3),

    /**
     * Event used to trigger the idle callback. Called after all UI work has been
     * dispatched to JS.
     */
    IDLE_EVENT(4),
    ;

    private final int mOrder;

    private CallbackType(int order) {
      mOrder = order;
    }

    /*package*/ int getOrder() {
      return mOrder;
    }
  }

  private static ReactChoreographer sInstance;

  public static void initialize() {
    if (sInstance == null) {
      sInstance = new ReactChoreographer();
    }
  }

  public static ReactChoreographer getInstance() {
    Assertions.assertNotNull(sInstance, "ReactChoreographer needs to be initialized.");
    return sInstance;
  }

  // This needs to be volatile due to double checked locking issue - https://fburl.com/z409owpf
  private @Nullable volatile ChoreographerCompat mChoreographer;
  private final ReactChoreographerDispatcher mReactChoreographerDispatcher;
  private final ArrayDeque<ChoreographerCompat.FrameCallback>[] mCallbackQueues;
  private final Object mCallbackQueuesLock = new Object();

  private int mTotalCallbacks = 0;
  private boolean mHasPostedCallback = false;

  private ReactChoreographer() {
    mReactChoreographerDispatcher = new ReactChoreographerDispatcher();
    mCallbackQueues = new ArrayDeque[CallbackType.values().length];
    for (int i = 0; i < mCallbackQueues.length; i++) {
      mCallbackQueues[i] = new ArrayDeque<>();
    }
    initializeChoreographer(null);
  }

  public void postFrameCallback(
    CallbackType type,
    ChoreographerCompat.FrameCallback frameCallback) {
    synchronized (mCallbackQueuesLock) {
      mCallbackQueues[type.getOrder()].addLast(frameCallback);
      mTotalCallbacks++;
      Assertions.assertCondition(mTotalCallbacks > 0);
      if (!mHasPostedCallback) {
        if (mChoreographer == null) {
          initializeChoreographer(
              new Runnable() {
                @Override
                public void run() {
                  postFrameCallbackOnChoreographer();
                }
              });
        } else {
          postFrameCallbackOnChoreographer();
        }
      }
    }
  }

  public void postFrameCallbackOnChoreographer() {
    mChoreographer.postFrameCallback(mReactChoreographerDispatcher);
    mHasPostedCallback = true;
  }

  public void initializeChoreographer(@Nullable final Runnable runnable) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        synchronized (ReactChoreographer.class) {
          if (mChoreographer == null) {
            mChoreographer = ChoreographerCompat.getInstance();
          }
        }
        if (runnable != null) {
          runnable.run();
        }
      }
    });
  }

  public void removeFrameCallback(
    CallbackType type,
    ChoreographerCompat.FrameCallback frameCallback) {
    synchronized (mCallbackQueuesLock) {
      if (mCallbackQueues[type.getOrder()].removeFirstOccurrence(frameCallback)) {
        mTotalCallbacks--;
        maybeRemoveFrameCallback();
      } else {
        FLog.e(ReactConstants.TAG, "Tried to remove non-existent frame callback");
      }
    }
  }

  private void maybeRemoveFrameCallback() {
    Assertions.assertCondition(mTotalCallbacks >= 0);
    if (mTotalCallbacks == 0 && mHasPostedCallback) {
      if (mChoreographer != null) {
        mChoreographer.removeFrameCallback(mReactChoreographerDispatcher);
      }
      mHasPostedCallback = false;
    }
  }

  private class ReactChoreographerDispatcher extends ChoreographerCompat.FrameCallback {

    @Override
    public void doFrame(long frameTimeNanos) {
      synchronized (mCallbackQueuesLock) {
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
}
