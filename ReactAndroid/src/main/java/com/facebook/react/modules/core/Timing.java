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

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.SystemClock;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.jstasks.HeadlessJsTaskEventListener;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Native module for JS timer execution. Timers fire on frame boundaries.
 */
@ReactModule(name = Timing.NAME)
public final class Timing extends ReactContextBaseJavaModule implements LifecycleEventListener,
  HeadlessJsTaskEventListener {

  protected static final String NAME = "Timing";

  // These timing contants should be kept in sync with the ones in `JSTimers.js`.
  // The minimum time in milliseconds left in the frame to call idle callbacks.
  private static final float IDLE_CALLBACK_FRAME_DEADLINE_MS = 1.f;
  // The total duration of a frame in milliseconds, this assumes that devices run at 60 fps.
  // TODO: Lower frame duration on devices that are too slow to run consistently
  // at 60 fps.
  private static final float FRAME_DURATION_MS = 1000.f / 60.f;

  private final DevSupportManager mDevSupportManager;

  private static class Timer {
    private final int mCallbackID;
    private final boolean mRepeat;
    private final int mInterval;
    private long mTargetTime;

    private Timer(
        int callbackID,
        long initialTargetTime,
        int duration,
        boolean repeat) {
      mCallbackID = callbackID;
      mTargetTime = initialTargetTime;
      mInterval = duration;
      mRepeat = repeat;
    }
  }

  private class TimerFrameCallback extends ChoreographerCompat.FrameCallback {

    // Temporary map for constructing the individual arrays of timers to call
    private @Nullable WritableArray mTimersToCall = null;

    /**
     * Calls all timers that have expired since the last time this frame callback was called.
     */
    @Override
    public void doFrame(long frameTimeNanos) {
      if (isPaused.get() && !isRunningTasks.get()) {
        return;
      }

      long frameTimeMillis = frameTimeNanos / 1000000;
      synchronized (mTimerGuard) {
        while (!mTimers.isEmpty() && mTimers.peek().mTargetTime < frameTimeMillis) {
          Timer timer = mTimers.poll();
          if (mTimersToCall == null) {
            mTimersToCall = Arguments.createArray();
          }
          mTimersToCall.pushInt(timer.mCallbackID);
          if (timer.mRepeat) {
            timer.mTargetTime = frameTimeMillis + timer.mInterval;
            mTimers.add(timer);
          } else {
            mTimerIdsToTimers.remove(timer.mCallbackID);
          }
        }
      }

      if (mTimersToCall != null) {
        getReactApplicationContext().getJSModule(JSTimers.class).callTimers(mTimersToCall);
        mTimersToCall = null;
      }

      mReactChoreographer.postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, this);
    }
  }

  private class IdleFrameCallback extends ChoreographerCompat.FrameCallback {

    @Override
    public void doFrame(long frameTimeNanos) {
      if (isPaused.get() && !isRunningTasks.get()) {
        return;
      }

      // If the JS thread is busy for multiple frames we cancel any other pending runnable.
      if (mCurrentIdleCallbackRunnable != null) {
        mCurrentIdleCallbackRunnable.cancel();
      }

      mCurrentIdleCallbackRunnable = new IdleCallbackRunnable(frameTimeNanos);
      getReactApplicationContext().runOnJSQueueThread(mCurrentIdleCallbackRunnable);

      mReactChoreographer.postFrameCallback(ReactChoreographer.CallbackType.IDLE_EVENT, this);
    }
  }

  private class IdleCallbackRunnable implements Runnable {
    private volatile boolean mCancelled = false;
    private final long mFrameStartTime;

    public IdleCallbackRunnable(long frameStartTime) {
      mFrameStartTime = frameStartTime;
    }

    @Override
    public void run() {
      if (mCancelled) {
        return;
      }

      long frameTimeMillis = mFrameStartTime / 1000000;
      long timeSinceBoot = SystemClock.uptimeMillis();
      long frameTimeElapsed = timeSinceBoot - frameTimeMillis;
      long time = SystemClock.currentTimeMillis();
      long absoluteFrameStartTime = time - frameTimeElapsed;

      if (FRAME_DURATION_MS - (float) frameTimeElapsed < IDLE_CALLBACK_FRAME_DEADLINE_MS) {
        return;
      }

      boolean sendIdleEvents;
      synchronized (mIdleCallbackGuard) {
        sendIdleEvents = mSendIdleEvents;
      }

      if (sendIdleEvents) {
        getReactApplicationContext().getJSModule(JSTimers.class)
            .callIdleCallbacks(absoluteFrameStartTime);
      }

      mCurrentIdleCallbackRunnable = null;
    }

    public void cancel() {
      mCancelled = true;
    }
  }

  private final Object mTimerGuard = new Object();
  private final Object mIdleCallbackGuard = new Object();
  private final PriorityQueue<Timer> mTimers;
  private final SparseArray<Timer> mTimerIdsToTimers;
  private final AtomicBoolean isPaused = new AtomicBoolean(true);
  private final AtomicBoolean isRunningTasks = new AtomicBoolean(false);
  private final TimerFrameCallback mTimerFrameCallback = new TimerFrameCallback();
  private final IdleFrameCallback mIdleFrameCallback = new IdleFrameCallback();
  private final ReactChoreographer mReactChoreographer;
  private @Nullable IdleCallbackRunnable mCurrentIdleCallbackRunnable;
  private boolean mFrameCallbackPosted = false;
  private boolean mFrameIdleCallbackPosted = false;
  private boolean mSendIdleEvents = false;

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
    mTimerIdsToTimers = new SparseArray<>();
    mReactChoreographer = ReactChoreographer.getInstance();
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
    HeadlessJsTaskContext headlessJsTaskContext =
      HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    headlessJsTaskContext.addTaskEventListener(this);
  }

  @Override
  public void onHostPause() {
    isPaused.set(true);
    clearFrameCallback();
    maybeIdleCallback();
  }

  @Override
  public void onHostDestroy() {
    clearFrameCallback();
    maybeIdleCallback();
  }

  @Override
  public void onHostResume() {
    isPaused.set(false);
    // TODO(5195192) Investigate possible problems related to restarting all tasks at the same
    // moment
    setChoreographerCallback();
    maybeSetChoreographerIdleCallback();
  }

  @Override
  public void onHeadlessJsTaskStart(int taskId) {
    if (!isRunningTasks.getAndSet(true)) {
      setChoreographerCallback();
      maybeSetChoreographerIdleCallback();
    }
  }

  @Override
  public void onHeadlessJsTaskFinish(int taskId) {
    HeadlessJsTaskContext headlessJsTaskContext =
      HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    if (!headlessJsTaskContext.hasActiveTasks()) {
      isRunningTasks.set(false);
      clearFrameCallback();
      maybeIdleCallback();
    }
  }

  @Override
  public void onCatalystInstanceDestroy() {
    clearFrameCallback();
    clearChoreographerIdleCallback();
    HeadlessJsTaskContext headlessJsTaskContext =
      HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    headlessJsTaskContext.removeTaskEventListener(this);
  }

  private void maybeSetChoreographerIdleCallback() {
    synchronized (mIdleCallbackGuard) {
      if (mSendIdleEvents) {
        setChoreographerIdleCallback();
      }
    }
  }

  private void maybeIdleCallback() {
    if (isPaused.get() && !isRunningTasks.get()) {
      clearFrameCallback();
    }
  }

  private void setChoreographerCallback() {
    if (!mFrameCallbackPosted) {
      mReactChoreographer.postFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          mTimerFrameCallback);
      mFrameCallbackPosted = true;
    }
  }

  private void clearFrameCallback() {
    HeadlessJsTaskContext headlessJsTaskContext =
      HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    if (mFrameCallbackPosted && isPaused.get() &&
      !headlessJsTaskContext.hasActiveTasks()) {
      mReactChoreographer.removeFrameCallback(
          ReactChoreographer.CallbackType.TIMERS_EVENTS,
          mTimerFrameCallback);
      mFrameCallbackPosted = false;
    }
  }

  private void setChoreographerIdleCallback() {
    if (!mFrameIdleCallbackPosted) {
      mReactChoreographer.postFrameCallback(
          ReactChoreographer.CallbackType.IDLE_EVENT,
          mIdleFrameCallback);
      mFrameIdleCallbackPosted = true;
    }
  }

  private void clearChoreographerIdleCallback() {
    if (mFrameIdleCallbackPosted) {
      mReactChoreographer.removeFrameCallback(
          ReactChoreographer.CallbackType.IDLE_EVENT,
          mIdleFrameCallback);
      mFrameIdleCallbackPosted = false;
    }
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void createTimer(
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
        getReactApplicationContext().getJSModule(JSTimers.class)
          .emitTimeDriftWarning(
            "Debugger and device times have drifted by more than 60s. Please correct this by " +
            "running adb shell \"date `date +%m%d%H%M%Y.%S`\" on your debugger machine.");
      }
    }

    // Adjust for the amount of time it took for native to receive the timer registration call
    long adjustedDuration = Math.max(0, remoteTime - deviceTime + duration);
    if (duration == 0 && !repeat) {
      WritableArray timerToCall = Arguments.createArray();
      timerToCall.pushInt(callbackID);
      getReactApplicationContext().getJSModule(JSTimers.class)
        .callTimers(timerToCall);
      return;
    }

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
      if (timer == null) {
        return;
      }
      mTimerIdsToTimers.remove(timerId);
      mTimers.remove(timer);
    }
  }

  @ReactMethod
  public void setSendIdleEvents(final boolean sendIdleEvents) {
    synchronized (mIdleCallbackGuard) {
      mSendIdleEvents = sendIdleEvents;
    }

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        synchronized (mIdleCallbackGuard) {
          if (sendIdleEvents) {
            setChoreographerIdleCallback();
          } else {
            clearChoreographerIdleCallback();
          }
        }
      }
    });
  }
}
