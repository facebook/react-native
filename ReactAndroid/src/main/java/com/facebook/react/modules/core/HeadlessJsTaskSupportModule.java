/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.core;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Simple native module that allows JS to notify native of having completed some task work, so that
 * it can e.g. release any resources, stop timers etc.
 */
@ReactModule(name = HeadlessJsTaskSupportModule.NAME)
public class HeadlessJsTaskSupportModule extends ReactContextBaseJavaModule {

  public static final String NAME = "HeadlessJsTaskSupport";

  public HeadlessJsTaskSupportModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void notifyTaskRetry(int taskId, Promise promise) {
    HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    if (headlessJsTaskContext.isTaskRunning(taskId)) {
      final boolean retryPosted = headlessJsTaskContext.retryTask(taskId);
      promise.resolve(retryPosted);
    } else {
      FLog.w(
          HeadlessJsTaskSupportModule.class,
          "Tried to retry non-active task with id %d. Did it time out?",
          taskId);
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void notifyTaskFinished(int taskId) {
    HeadlessJsTaskContext headlessJsTaskContext =
        HeadlessJsTaskContext.getInstance(getReactApplicationContext());
    if (headlessJsTaskContext.isTaskRunning(taskId)) {
      headlessJsTaskContext.finishTask(taskId);
    } else {
      FLog.w(
          HeadlessJsTaskSupportModule.class,
          "Tried to finish non-active task with id %d. Did it time out?",
          taskId);
    }
  }
}
