/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import android.view.Choreographer;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.internal.ChoreographerProvider;
import java.util.ArrayDeque;

/**
 * A simple wrapper around Choreographer that allows us to control the order certain callbacks are
 * executed within a given frame. The wrapped Choreographer instance will always be the main thread
 * one and the API's are safe to use from any thread.
 */
public final class ReactChoreographer {

  public enum CallbackType {

    /** For use by perf markers that need to happen immediately after draw */
    PERF_MARKERS(0),

    /** For use by {@link com.facebook.react.uimanager.UIManagerModule} */
    DISPATCH_UI(1),

    /** For use by {@link com.facebook.react.animated.NativeAnimatedModule} */
    NATIVE_ANIMATED_MODULE(2),

    /** Events that make JS do things. */
    TIMERS_EVENTS(3),

    /**
     * Event used to trigger the idle callback. Called after all UI work has been dispatched to JS.
     */
    IDLE_EVENT(4),
    ;

    private final int mOrder;

    CallbackType(int order) {
      mOrder = order;
    }

    /*package*/ int getOrder() {
      return mOrder;
    }
  }

  private static ReactChoreographer sInstance;

  public static void initialize(ChoreographerProvider choreographerProvider) {
    if (sInstance == null) {
      sInstance = new ReactChoreographer(choreographerProvider);
    }
  }

  public static ReactChoreographer getInstance() {
    Assertions.assertNotNull(sInstance, "ReactChoreographer needs to be initialized.");
    return sInstance;
  }

  private @Nullable ChoreographerProvider.Choreographer mChoreographer;

  private final ArrayDeque<Choreographer.FrameCallback>[] mCallbackQueues;

  private final Choreographer.FrameCallback mFrameCallback =
      new Choreographer.FrameCallback() {
        @Override
        public void doFrame(long frameTimeNanos) {
          synchronized (mCallbackQueues) {
            // Callbacks run once and are then automatically removed, the callback will
            // be posted again from postFrameCallback
            mHasPostedCallback = false;

            for (int i = 0; i < mCallbackQueues.length; i++) {
              ArrayDeque<Choreographer.FrameCallback> callbackQueue = mCallbackQueues[i];
              int initialLength = callbackQueue.size();
              for (int callback = 0; callback < initialLength; callback++) {
                Choreographer.FrameCallback frameCallback = callbackQueue.pollFirst();
                if (frameCallback != null) {
                  frameCallback.doFrame(frameTimeNanos);
                  mTotalCallbacks--;
                } else {
                  FLog.e(ReactConstants.TAG, "Tried to execute non-existent frame callback");
                }
              }
            }
            maybeRemoveFrameCallback();
          }
        }
      };

  private int mTotalCallbacks = 0;
  private boolean mHasPostedCallback = false;

  private ReactChoreographer(ChoreographerProvider choreographerProvider) {
    mCallbackQueues = new ArrayDeque[CallbackType.values().length];
    for (int i = 0; i < mCallbackQueues.length; i++) {
      mCallbackQueues[i] = new ArrayDeque<>();
    }

    UiThreadUtil.runOnUiThread(
        () -> {
          mChoreographer = choreographerProvider.getChoreographer();
        });
  }

  public void postFrameCallback(CallbackType type, Choreographer.FrameCallback frameCallback) {
    synchronized (mCallbackQueues) {
      mCallbackQueues[type.getOrder()].addLast(frameCallback);
      mTotalCallbacks++;
      Assertions.assertCondition(mTotalCallbacks > 0);

      if (!mHasPostedCallback) {
        if (mChoreographer == null) {
          // Schedule on the main thread, at which point the constructor's async work will have
          // completed
          UiThreadUtil.runOnUiThread(
              () -> {
                synchronized (mCallbackQueues) {
                  postFrameCallbackOnChoreographer();
                }
              });
        } else {
          postFrameCallbackOnChoreographer();
        }
      }
    }
  }

  /**
   * This method writes on mHasPostedCallback and it should be called from another method that has
   * the lock mCallbackQueues
   */
  private void postFrameCallbackOnChoreographer() {
    mChoreographer.postFrameCallback(mFrameCallback);
    mHasPostedCallback = true;
  }

  public void removeFrameCallback(CallbackType type, Choreographer.FrameCallback frameCallback) {
    synchronized (mCallbackQueues) {
      if (mCallbackQueues[type.getOrder()].removeFirstOccurrence(frameCallback)) {
        mTotalCallbacks--;
        maybeRemoveFrameCallback();
      } else {
        FLog.e(ReactConstants.TAG, "Tried to remove non-existent frame callback");
      }
    }
  }

  /**
   * This method reads and writes on mHasPostedCallback and it should be called from another method
   * that already has the lock on mCallbackQueues.
   */
  private void maybeRemoveFrameCallback() {
    Assertions.assertCondition(mTotalCallbacks >= 0);
    if (mTotalCallbacks == 0 && mHasPostedCallback) {
      if (mChoreographer != null) {
        mChoreographer.removeFrameCallback(mFrameCallback);
      }
      mHasPostedCallback = false;
    }
  }
}
