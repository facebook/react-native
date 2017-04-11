/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.jstasks.HeadlessJsTaskContext;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Simple native module that allows JS to notify native of having completed some task work, so that
 * it can e.g. release any resources, stop timers etc.
 */
@ReactModule(name = HeadlessJsTaskSupportModule.MODULE_NAME, hasConstants = false)
public class HeadlessJsTaskSupportModule extends ReactContextBaseJavaModule {

  protected static final String MODULE_NAME = "HeadlessJsTaskSupport";

  public HeadlessJsTaskSupportModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
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
