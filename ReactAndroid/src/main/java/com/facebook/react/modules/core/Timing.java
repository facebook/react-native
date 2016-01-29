/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import javax.annotation.Nullable;

import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.concurrent.atomic.AtomicBoolean;

import android.util.SparseArray;
import android.view.Choreographer;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.ReactChoreographer;

/**
 * Native module for JS timer execution. Timers fire on frame boundaries.
 */
public final class Timing extends ReactContextBaseJavaModule implements LifecycleEventListener {

  private static class Timer {

    private final int mCallbackID;
    private final boolean mRepeat;
    private final int mInterval;
    private long mTargetTime;

    private Timer(int callbackID, long initialTargetTime, int duration, boolean repeat) {
      mCallbackID = callbackID;
      mTargetTime = initialTargetTime;
      mInterval = duration;
      mRepeat = repeat;
    }
  }

  private class FrameCallback implements Choreographer.FrameCallback {

    /**
     * Calls all timers that have expired since the last time this frame callback was called.
     */
    @Override
    public void doFrame(long frameTimeNanos) {
      if (isPaused.get()) {
        return;
      }

      long frameTimeMillis = frameTimeNanos / 1000000;
      WritableArray timersToCall = null;
      synchronized (mTimerGuard) {
        while (!mTimers.isEmpty() && mTimers.peek().mTargetTime < frameTimeMillis) {
          Timer timer = mTimers.poll();
          if (timersToCall == null) {
            timersToCall = Arguments.createArray();
          }
          timersToCall.pushInt(timer.mCallbackID);
          if (timer.mRepeat) {
            timer.mTargetTime = frameTimeMillis + timer.mInterval;
            mTimers.add(timer);
          } else {
            mTimerIdsToTimers.remove(timer.mCallbackID);
          }
        }
      }

      if (timersToCall != null) {
        Assertions.assertNotNull(mJSTimersModule).callTimers(timersToCall);
      }

      Assertions.assertNotNull(mReactChoreographer)
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, this);
    }
  }

  private final Object mTimerGuard = new Object();
  private final PriorityQueue<Timer> mTimers;
  private final SparseArray<Timer> mTimerIdsToTimers;
  private final AtomicBoolean isPaused = new AtomicBoolean(true);
  private final FrameCallback mFrameCallback = new FrameCallback();
  private @Nullable ReactChoreographer mReactChoreographer;
  private @Nullable JSTimersExecution mJSTimersModule;
  private boolean mFrameCallbackPosted = false;

  public Timing(ReactApplicationContext reactContext) {
    super(reactContext);
    // We store timers sorted by finish time.
    mTimers = new PriorityQueue<Timer>(
        11, // Default capacity: for some reason they don't expose a (Comparator) constructor
        new Comparator<Timer>() {
          @Override
          public int compare(Timer lhs, Timer rhs) {
            long diff = lhs.mTargetTime - rhs.mTargetTime;
            if (diff == 0) {
              return 0;
            } else if (diff < 0) {
              return -1;
            } else {
              return 1;
            }
          }
        });
    mTimerIdsToTimers = new SparseArray<Timer>();
  }

  @Override
  public void initialize() {
    // Safe to acquire choreographer here, as initialize() is invoked from UI thread.
    mReactChoreographer = ReactChoreographer.getInstance();
    mJSTimersModule = getReactApplicationContext().getCatalystInstance()
        .getJSModule(JSTimersExecution.class);
    getReactApplicationContext().addLifecycleEventListener(this);
  }

  @Override
  public void onHostPause() {
    isPaused.set(true);
    clearChoreographerCallback();
  }

  @Override
  public void onHostDestroy() {
    clearChoreographerCallback();
  }

  @Override
  public void onHostResume() {
    isPaused.set(false);
    // TODO(5195192) Investigate possible problems related to restarting all tasks at the same
    // moment
    setChoreographerCallback();
  }

  @Override
  public void onCatalystInstanceDestroy() {
    clearChoreographerCallback();
  }

  private void setChoreographerCallback() {
    if (!mFrameCallbackPosted) {
      Assertions.assertNotNull(mReactChoreographer).postFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          mFrameCallback);
      mFrameCallbackPosted = true;
    }
  }

  private void clearChoreographerCallback() {
    if (mFrameCallbackPosted) {
      Assertions.assertNotNull(mReactChoreographer).removeFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          mFrameCallback);
      mFrameCallbackPosted = false;
    }
  }

  @Override
  public String getName() {
    return "RKTiming";
  }

  @ReactMethod
  public void createTimer(
      final int callbackID,
      final int duration,
      final double jsSchedulingTime,
      final boolean repeat) {
    // Adjust for the amount of time it took for native to receive the timer registration call
    long adjustedDuration = (long) Math.max(
        0,
        jsSchedulingTime - SystemClock.currentTimeMillis() + duration);
    long initialTargetTime = SystemClock.nanoTime() / 1000000 + adjustedDuration;
    Timer timer = new Timer(callbackID, initialTargetTime, duration, repeat);
    synchronized (mTimerGuard) {
      mTimers.add(timer);
      mTimerIdsToTimers.put(callbackID, timer);
    }
  }

  @ReactMethod
  public void deleteTimer(int timerId) {
    synchronized (mTimerGuard) {
      Timer timer = mTimerIdsToTimers.get(timerId);
      if (timer != null) {
        // We may have already called/removed it
        mTimerIdsToTimers.remove(timerId);
        mTimers.remove(timer);
      }
    }
  }
}
