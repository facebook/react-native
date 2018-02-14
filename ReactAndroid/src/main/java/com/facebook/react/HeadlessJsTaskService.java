/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import javax.annotation.Nullable;

import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;
import android.os.PowerManager;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.jstasks.HeadlessJsTaskEventListener;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.jstasks.HeadlessJsTaskContext;

/**
 * Base class for running JS without a UI. Generally, you only need to override
 * {@link #getTaskConfig}, which is called for every {@link #onStartCommand}. The
 * result, if not {@code null}, is used to run a JS task.
 *
 * If you need more fine-grained control over how tasks are run, you can override
 * {@link #onStartCommand} and call {@link #startTask} depending on your custom logic.
 *
 * If you're starting a {@code HeadlessJsTaskService} from a {@code BroadcastReceiver} (e.g.
 * handling push notifications), make sure to call {@link #acquireWakeLockNow} before returning from
 * {@link BroadcastReceiver#onReceive}, to make sure the device doesn't go to sleep before the
 * service is started.
 */
public abstract class HeadlessJsTaskService extends Service implements HeadlessJsTaskEventListener {

  private final Set<Integer> mActiveTasks = new CopyOnWriteArraySet<>();
  private static @Nullable PowerManager.WakeLock sWakeLock;

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    HeadlessJsTaskConfig taskConfig = getTaskConfig(intent);
    if (taskConfig != null) {
      startTask(taskConfig);
      return START_REDELIVER_INTENT;
    }
    return START_NOT_STICKY;
  }

  /**
   * Called from {@link #onStartCommand} to create a {@link HeadlessJsTaskConfig} for this intent.
   * @param intent the {@link Intent} received in {@link #onStartCommand}.
   * @return a {@link HeadlessJsTaskConfig} to be used with {@link #startTask}, or
   *         {@code null} to ignore this command.
   */
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    return null;
  }

  /**
   * Acquire a wake lock to ensure the device doesn't go to sleep while processing background tasks.
   */
  public static void acquireWakeLockNow(Context context) {
    if (sWakeLock == null || !sWakeLock.isHeld()) {
      PowerManager powerManager =
        Assertions.assertNotNull((PowerManager) context.getSystemService(POWER_SERVICE));
      sWakeLock = powerManager.newWakeLock(
        PowerManager.PARTIAL_WAKE_LOCK,
        HeadlessJsTaskService.class.getSimpleName());
      sWakeLock.setReferenceCounted(false);
      sWakeLock.acquire();
    }
  }

  @Override
  public @Nullable IBinder onBind(Intent intent) {
    return null;
  }

  /**
   * Start a task. This method handles starting a new React instance if required.
   *
   * Has to be called on the UI thread.
   *
   * @param taskConfig describes what task to start and the parameters to pass to it
   */
  protected void startTask(final HeadlessJsTaskConfig taskConfig) {
    UiThreadUtil.assertOnUiThread();
    acquireWakeLockNow(this);
    final ReactInstanceManager reactInstanceManager =
      getReactNativeHost().getReactInstanceManager();
    ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
    if (reactContext == null) {
      reactInstanceManager
        .addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
          @Override
          public void onReactContextInitialized(ReactContext reactContext) {
            invokeStartTask(reactContext, taskConfig);
            reactInstanceManager.removeReactInstanceEventListener(this);
          }
        });
      if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
        reactInstanceManager.createReactContextInBackground();
      }
    } else {
      invokeStartTask(reactContext, taskConfig);
    }
  }

  private void invokeStartTask(ReactContext reactContext, final HeadlessJsTaskConfig taskConfig) {
    final HeadlessJsTaskContext headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactContext);
    headlessJsTaskContext.addTaskEventListener(this);

    UiThreadUtil.runOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          int taskId = headlessJsTaskContext.startTask(taskConfig);
          mActiveTasks.add(taskId);
        }
      }
    );
  }

  @Override
  public void onDestroy() {
    super.onDestroy();

    if (getReactNativeHost().hasInstance()) {
      ReactInstanceManager reactInstanceManager = getReactNativeHost().getReactInstanceManager();
      ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
      if (reactContext != null) {
        HeadlessJsTaskContext headlessJsTaskContext =
          HeadlessJsTaskContext.getInstance(reactContext);
        headlessJsTaskContext.removeTaskEventListener(this);
      }
    }
    if (sWakeLock != null) {
      sWakeLock.release();
    }
  }

  @Override
  public void onHeadlessJsTaskStart(int taskId) { }

  @Override
  public void onHeadlessJsTaskFinish(int taskId) {
    mActiveTasks.remove(taskId);
    if (mActiveTasks.size() == 0) {
      stopSelf();
    }
  }

  /**
   * Get the {@link ReactNativeHost} used by this app. By default, assumes {@link #getApplication()}
   * is an instance of {@link ReactApplication} and calls
   * {@link ReactApplication#getReactNativeHost()}. Override this method if your application class
   * does not implement {@code ReactApplication} or you simply have a different mechanism for
   * storing a {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) getApplication()).getReactNativeHost();
  }
}
