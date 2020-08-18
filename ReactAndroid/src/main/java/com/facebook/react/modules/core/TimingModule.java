/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.jstasks.HeadlessJsTaskEventListener;
import com.facebook.react.module.annotations.ReactModule;

/** Native module for JS timer execution. Timers fire on frame boundaries. */
@ReactModule(name = TimingModule.NAME)
public final class TimingModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener, HeadlessJsTaskEventListener {

  public class BridgeTimerManager implements JavaScriptTimerManager {
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
  }

  public static final String NAME = "Timing";

  private final JavaTimerManager mJavaTimerManager;

  public TimingModule(ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);

    mJavaTimerManager =
        new JavaTimerManager(
            reactContext,
            new BridgeTimerManager(),
            ReactChoreographer.getInstance(),
            devSupportManager);
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
    HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    headlessJsTaskContext.addTaskEventListener(this);
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
    mJavaTimerManager.createAndMaybeCallTimer(callbackID, duration, jsSchedulingTime, repeat);
  }

  @ReactMethod
  public void deleteTimer(int timerId) {
    mJavaTimerManager.deleteTimer(timerId);
  }

  @ReactMethod
  public void setSendIdleEvents(final boolean sendIdleEvents) {
    mJavaTimerManager.setSendIdleEvents(sendIdleEvents);
  }

  @Override
  public void onHostResume() {
    mJavaTimerManager.onHostResume();
  }

  @Override
  public void onHostPause() {
    mJavaTimerManager.onHostPause();
  }

  @Override
  public void onHostDestroy() {
    mJavaTimerManager.onHostDestroy();
  }

  @Override
  public void onHeadlessJsTaskStart(int taskId) {
    mJavaTimerManager.onHeadlessJsTaskStart(taskId);
  }

  @Override
  public void onHeadlessJsTaskFinish(int taskId) {
    mJavaTimerManager.onHeadlessJsTaskFinish(taskId);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    headlessJsTaskContext.removeTaskEventListener(this);
    mJavaTimerManager.onInstanceDestroy();
  }
}
