/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import com.facebook.fbreact.specs.NativeTimingSpec;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.module.annotations.ReactModule;

/** Native module for JS timer execution. Timers fire on frame boundaries. */
@ReactModule(name = NativeTimingSpec.NAME)
public final class TimingModule extends NativeTimingSpec implements JavaScriptTimerExecutor {
  private final JavaTimerManager mJavaTimerManager;

  public TimingModule(ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);

    mJavaTimerManager =
        new JavaTimerManager(
            reactContext, this, ReactChoreographer.getInstance(), devSupportManager);
  }

  @Override
  public void initialize() {
    HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    headlessJsTaskContext.addTaskEventListener(mJavaTimerManager);
  }

  @Override
  public void createTimer(
      final double callbackIDDouble,
      final double durationDouble,
      final double jsSchedulingTime,
      final boolean repeat) {
    final int callbackID = (int) callbackIDDouble;
    final int duration = (int) durationDouble;

    mJavaTimerManager.createAndMaybeCallTimer(callbackID, duration, jsSchedulingTime, repeat);
  }

  @Override
  public void deleteTimer(double timerIdDouble) {
    int timerId = (int) timerIdDouble;

    mJavaTimerManager.deleteTimer(timerId);
  }

  @Override
  public void setSendIdleEvents(final boolean sendIdleEvents) {
    mJavaTimerManager.setSendIdleEvents(sendIdleEvents);
  }

  @Override
  public void callTimers(WritableArray timerIDs) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      reactApplicationContext.getJSModule(JSTimers.class).callTimers(timerIDs);
    }
  }

  @Override
  public void callIdleCallbacks(double frameTime) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      reactApplicationContext.getJSModule(JSTimers.class).callIdleCallbacks(frameTime);
    }
  }

  @Override
  public void emitTimeDriftWarning(String warningMessage) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      reactApplicationContext.getJSModule(JSTimers.class).emitTimeDriftWarning(warningMessage);
    }
  }

  @Override
  public void invalidate() {
    ReactApplicationContext reactApplicationContext = getReactApplicationContext();

    HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(reactApplicationContext);
    headlessJsTaskContext.removeTaskEventListener(mJavaTimerManager);

    mJavaTimerManager.onInstanceDestroy();
  }

  @VisibleForTesting
  public boolean hasActiveTimersInRange(long rangeMs) {
    return mJavaTimerManager.hasActiveTimersInRange(rangeMs);
  }
}
