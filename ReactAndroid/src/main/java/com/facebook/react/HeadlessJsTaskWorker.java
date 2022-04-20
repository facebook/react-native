/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.work.Data;
import androidx.work.ListenableWorker;
import androidx.work.WorkerParameters;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.jstasks.HeadlessJsTaskEventListener;
import com.google.common.util.concurrent.ListenableFuture;

/**
 * Base class for running JS without a UI. Generally, you only need to override {@link
 * #getTaskConfig}, which is called for every {@link #startWork}. The result, if not {@code null},
 * is used to run a JS task.
 *
 * <p>If you need more fine-grained control over how tasks are run, you can override {@link
 * #startWork} and call {@link #startTask} depending on your custom logic.
 */
public abstract class HeadlessJsTaskWorker extends ListenableWorker
    implements HeadlessJsTaskEventListener {
  private CallbackToFutureAdapter.Completer<Result> mCompleter = null;

  public HeadlessJsTaskWorker(@NonNull Context context, @NonNull WorkerParameters params) {
    super(context, params);
  }

  @NonNull
  @Override
  public ListenableFuture<Result> startWork() {
    return CallbackToFutureAdapter.getFuture(
        new CallbackToFutureAdapter.Resolver<Result>() {
          @Override
          public Object attachCompleter(
              @NonNull CallbackToFutureAdapter.Completer<Result> completer) throws Exception {
            mCompleter = completer;
            HeadlessJsTaskConfig taskConfig = getTaskConfig(getInputData());
            if (taskConfig != null) {
              startTask(taskConfig);
            } else {
              completer.set(Result.failure());
            }
            return "HeadlessJsTaskWorker.startTask operation";
          }
        });
  }

  /**
   * Called from {@link #startWork} to create a {@link HeadlessJsTaskConfig} for this input data.
   *
   * @param data the {@link Data} received in {@link #startWork}.
   * @return a {@link HeadlessJsTaskConfig} to be used with {@link #startTask}, or {@code null} to
   *     ignore this command.
   */
  protected @Nullable abstract HeadlessJsTaskConfig getTaskConfig(Data data);

  /**
   * Start a task. This method handles starting a new React instance if required.
   *
   * <p>Has to be called on the UI thread.
   *
   * @param taskConfig describes what task to start and the parameters to pass to it
   */
  protected void startTask(final HeadlessJsTaskConfig taskConfig) {
    final ReactInstanceManager reactInstanceManager =
        getReactNativeHost().getReactInstanceManager();
    ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
    if (reactContext == null) {
      reactInstanceManager.addReactInstanceEventListener(
          new ReactInstanceEventListener() {
            public void onReactContextInitialized(ReactContext reactContext) {
              invokeStartTask(reactContext, taskConfig);
              reactInstanceManager.removeReactInstanceEventListener(this);
            }
          });
      reactInstanceManager.createReactContextInBackground();
    } else {
      invokeStartTask(reactContext, taskConfig);
    }
  }

  private void invokeStartTask(ReactContext reactContext, final HeadlessJsTaskConfig taskConfig) {
    final HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(reactContext);
    headlessJsTaskContext.addTaskEventListener(this);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            headlessJsTaskContext.startTask(taskConfig);
          }
        });
  }

  private void cleanUpTask() {
    mCompleter = null;
    if (getReactNativeHost().hasInstance()) {
      ReactInstanceManager reactInstanceManager = getReactNativeHost().getReactInstanceManager();
      ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
      if (reactContext != null) {
        HeadlessJsTaskContext headlessJsTaskContext =
            HeadlessJsTaskContext.getInstance(reactContext);
        headlessJsTaskContext.removeTaskEventListener(this);
      }
    }
  }

  @Override
  public void onStopped() {
    super.onStopped();
    cleanUpTask();
  }

  @Override
  public void onHeadlessJsTaskStart(int taskId) {}

  @Override
  public void onHeadlessJsTaskFinish(int taskId) {
    if (mCompleter != null) {
      mCompleter.set(Result.success());
    }
    cleanUpTask();
  }

  /**
   * Get the {@link ReactNativeHost} used by this app. By default, assumes {@link
   * #getApplicationContext()} is an instance of {@link ReactApplication} and calls {@link
   * ReactApplication#getReactNativeHost()}. Override this method if your application class does not
   * implement {@code ReactApplication} or you simply have a different mechanism for storing a
   * {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) getApplicationContext()).getReactNativeHost();
  }
}
