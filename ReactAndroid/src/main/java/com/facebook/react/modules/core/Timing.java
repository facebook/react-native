/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import android.util.SparseArray;
import android.view.Choreographer;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.OnExecutorUnregisteredListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.SystemClock;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.uimanager.ReactChoreographer;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.Nullable;

/**
 * Native module for JS timer execution. Timers fire on frame boundaries.
 */
public final class Timing extends ReactContextBaseJavaModule implements LifecycleEventListener,
  OnExecutorUnregisteredListener {

  private final DevSupportManager mDevSupportManager;

  private static class Timer {

    private final ExecutorToken mExecutorToken;
    private final int mCallbackID;
    private final boolean mRepeat;
    private final int mInterval;
    private long mTargetTime;

    private Timer(
        ExecutorToken executorToken,
        int callbackID,
        long initialTargetTime,
        int duration,
        boolean repeat) {
      mExecutorToken = executorToken;
      mCallbackID = callbackID;
      mTargetTime = initialTargetTime;
      mInterval = duration;
      mRepeat = repeat;
    }
  }

  private static class IdleCallback {

    private final ExecutorToken mExecutorToken;
    private final int mCallbackID;

    private IdleCallback(ExecutorToken executorToken, int callbackID) {
      mExecutorToken = executorToken;
      mCallbackID = callbackID;
      // Will have timeout
    }
  }

  private class TimerFrameCallback implements Choreographer.FrameCallback {

    // Temporary map for constructing the individual arrays of timers per ExecutorToken
    private final HashMap<ExecutorToken, WritableArray> mTimersToCall = new HashMap<>();

    /**
     * Calls all timers that have expired since the last time this frame callback was called.
     */
    @Override
    public void doFrame(long frameTimeNanos) {
      if (isPaused.get()) {
        return;
      }

      long frameTimeMillis = frameTimeNanos / 1000000;
      synchronized (mTimerGuard) {
        while (!mTimers.isEmpty() && mTimers.peek().mTargetTime < frameTimeMillis) {
          Timer timer = mTimers.poll();
          WritableArray timersForContext = mTimersToCall.get(timer.mExecutorToken);
          if (timersForContext == null) {
            timersForContext = Arguments.createArray();
            mTimersToCall.put(timer.mExecutorToken, timersForContext);
          }
          timersForContext.pushInt(timer.mCallbackID);
          if (timer.mRepeat) {
            timer.mTargetTime = frameTimeMillis + timer.mInterval;
            mTimers.add(timer);
          } else {
            mTimerIdsToTimers.remove(timer.mCallbackID);
          }
        }
      }

      for (Map.Entry<ExecutorToken, WritableArray> entry : mTimersToCall.entrySet()) {
        getReactApplicationContext().getJSModule(entry.getKey(), JSTimersExecution.class)
            .callTimers(entry.getValue());
      }
      mTimersToCall.clear();

      Assertions.assertNotNull(mReactChoreographer)
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, this);
    }
  }

  private class IdleFrameCallback implements Choreographer.FrameCallback {

    private final Map<ExecutorToken, WritableArray> mIdleCallbacksToCall = new HashMap<>();

    /**
     * Calls all idle frame callbacks if greater than some threshold of time
     * remaining
     */
    @Override
    public void doFrame(long frameTimeNanos) {
      if (isPaused.get()) {
        return;
      }

      long frameTimeMillis = frameTimeNanos / 1000000;
      long timeSinceBoot = SystemClock.uptimeMillis();
      long frameTimeElapsed = timeSinceBoot - frameTimeMillis;
      long time = SystemClock.currentTimeMillis();
      long absoluteFrameStartTime = time - frameTimeElapsed;
      long frameTimeRemaining = Math.max(0, 17 - frameTimeElapsed);

      // Arbitrary threshold: 12ms remaining in frame
      if (frameTimeRemaining >= 12) {
        List<IdleCallback> idleCallbacksToRemove = null;
        synchronized (mIdleCallbackGuard) {
          for (IdleCallback idleCallback : mIdleCallbacks) {
            if (idleCallbacksToRemove == null) {
              idleCallbacksToRemove = new ArrayList<>();
            }

            WritableArray idleCallbacksForContext =
                mIdleCallbacksToCall.get(idleCallback.mExecutorToken);
            if (idleCallbacksForContext == null) {
              idleCallbacksForContext = Arguments.createArray();
              mIdleCallbacksToCall.put(idleCallback.mExecutorToken, idleCallbacksForContext);
            }

            if (idleCallbacksForContext.size() < 5) {
              idleCallbacksForContext.pushInt(idleCallback.mCallbackID);
              idleCallbacksToRemove.add(idleCallback);
            }
          }
          mIdleCallbacks.removeAll(idleCallbacksToRemove);
        }

        if (!mIdleCallbacksToCall.isEmpty()) {
          for (Map.Entry<ExecutorToken, WritableArray> entry : mIdleCallbacksToCall.entrySet()) {
            getReactApplicationContext().getJSModule(entry.getKey(), JSTimersExecution.class)
                .callIdleCallbacks(entry.getValue(), absoluteFrameStartTime);
          }
        }
        mIdleCallbacksToCall.clear();
      }

      Assertions.assertNotNull(mChoreographer).postFrameCallback(this);
    }
  }

  private final Object mTimerGuard = new Object();
  private final Object mIdleCallbackGuard = new Object();
  private final PriorityQueue<Timer> mTimers;
  private final HashMap<ExecutorToken, SparseArray<Timer>> mTimerIdsToTimers;
  private final ArrayList<IdleCallback> mIdleCallbacks;
  private final HashMap<ExecutorToken, SparseArray<IdleCallback>> mExecutorTokenToIdleCallbacks;
  private final AtomicBoolean isPaused = new AtomicBoolean(true);
  private final TimerFrameCallback mTimerFrameCallback = new TimerFrameCallback();
  private final IdleFrameCallback mIdleFrameCallback = new IdleFrameCallback();
  private @Nullable ReactChoreographer mReactChoreographer;
  private @Nullable Choreographer mChoreographer;
  private boolean mFrameCallbackPosted = false;

  public Timing(ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);
    mDevSupportManager = devSupportManager;
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
    mTimerIdsToTimers = new HashMap<>();
    mIdleCallbacks = new ArrayList<>();
    mExecutorTokenToIdleCallbacks = new HashMap<>();
  }

  @Override
  public void initialize() {
    // Safe to acquire choreographer here, as initialize() is invoked from UI thread.
    mReactChoreographer = ReactChoreographer.getInstance();
    mChoreographer = ReactChoreographer.getChoreographerInstance();
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
          mTimerFrameCallback);
      Assertions.assertNotNull(mChoreographer).postFrameCallback(
          mIdleFrameCallback);
      mFrameCallbackPosted = true;
    }
  }

  private void clearChoreographerCallback() {
    if (mFrameCallbackPosted) {
      Assertions.assertNotNull(mReactChoreographer).removeFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          mTimerFrameCallback);
      Assertions.assertNotNull(mChoreographer).removeFrameCallback(
          mIdleFrameCallback);
      mFrameCallbackPosted = false;
    }
  }

  @Override
  public String getName() {
    return "RCTTiming";
  }

  @Override
  public boolean supportsWebWorkers() {
    return true;
  }

  @Override
  public void onExecutorDestroyed(ExecutorToken executorToken) {
    synchronized (mTimerGuard) {
      SparseArray<Timer> timersForContext = mTimerIdsToTimers.remove(executorToken);
      if (timersForContext == null) {
        return;
      }
      for (int i = 0; i < timersForContext.size(); i++) {
        Timer timer = timersForContext.get(timersForContext.keyAt(i));
        mTimers.remove(timer);
      }
    }
  }

  @ReactMethod
  public void createTimer(
      ExecutorToken executorToken,
      final int callbackID,
      final int duration,
      final double jsSchedulingTime,
      final boolean repeat) {
    long deviceTime = SystemClock.currentTimeMillis();
    long remoteTime = (long) jsSchedulingTime;

    // If the times on the server and device have drifted throw an exception to warn the developer
    // that things might not work or results may not be accurate. This is required only for
    // developer builds.
    if (mDevSupportManager.getDevSupportEnabled()) {
      long driftTime = Math.abs(remoteTime - deviceTime);
      if (driftTime > 60000) {
        throw new RuntimeException(
          "Debugger and device times have drifted by more than 60s." +
          "Please correct this by running adb shell " +
          "\"date `date +%m%d%H%M%Y.%S`\" on your debugger machine."
        );
      }
    }

    // Adjust for the amount of time it took for native to receive the timer registration call
    long adjustedDuration = Math.max(0, remoteTime - deviceTime + duration);
    if (duration == 0 && !repeat) {
      WritableArray timerToCall = Arguments.createArray();
      timerToCall.pushInt(callbackID);
      getReactApplicationContext().getJSModule(executorToken, JSTimersExecution.class)
        .callTimers(timerToCall);
      return;
    }

    long initialTargetTime = SystemClock.nanoTime() / 1000000 + adjustedDuration;
    Timer timer = new Timer(executorToken, callbackID, initialTargetTime, duration, repeat);
    synchronized (mTimerGuard) {
      mTimers.add(timer);
      SparseArray<Timer> timersForContext = mTimerIdsToTimers.get(executorToken);
      if (timersForContext == null) {
        timersForContext = new SparseArray<>();
        mTimerIdsToTimers.put(executorToken, timersForContext);
      }
      timersForContext.put(callbackID, timer);
    }
  }

  @ReactMethod
  public void deleteTimer(ExecutorToken executorToken, int timerId) {
    synchronized (mTimerGuard) {
      SparseArray<Timer> timersForContext = mTimerIdsToTimers.get(executorToken);
      if (timersForContext == null) {
        return;
      }
      Timer timer = timersForContext.get(timerId);
      if (timer == null) {
        return;
      }
      // We may have already called/removed it
      mTimerIdsToTimers.remove(timerId);
      mTimers.remove(timer);
    }
  }

  @ReactMethod
  public void createIdleCallback(
      ExecutorToken executorToken,
      final int callbackID) {
    IdleCallback idleCallback = new IdleCallback(executorToken, callbackID);
    synchronized (mIdleCallbackGuard) {
      mIdleCallbacks.add(idleCallback);
      SparseArray<IdleCallback> idleCallbacksForContext =
          mExecutorTokenToIdleCallbacks.get(executorToken);
      if (idleCallbacksForContext == null) {
        idleCallbacksForContext = new SparseArray<>();
        mExecutorTokenToIdleCallbacks.put(executorToken, idleCallbacksForContext);
      }
      idleCallbacksForContext.put(callbackID, idleCallback);
    }
  }
}
