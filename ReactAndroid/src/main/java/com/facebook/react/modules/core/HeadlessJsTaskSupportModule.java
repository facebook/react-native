/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeHeadlessJsTaskSupportSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Simple native module that allows JS to notify native of having completed some task work, so that
 * it can e.g. release any resources, stop timers etc.
 */
@ReactModule(name = HeadlessJsTaskSupportModule.NAME)
public class HeadlessJsTaskSupportModule extends NativeHeadlessJsTaskSupportSpec {

  public static final String NAME = "HeadlessJsTaskSupport";

  public HeadlessJsTaskSupportModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void notifyTaskRetry(double taskIdDouble, Promise promise) {
    int taskId = (int) taskIdDouble;

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

  @Override
  public void notifyTaskFinished(double taskIdDouble) {
    int taskId = (int) taskIdDouble;

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
