/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeHeadlessJsTaskSupportSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.module.annotations.ReactModule

/**
 * Simple native module that allows JS to notify native of having completed some task work, so that
 * it can e.g. release any resources, stop timers etc.
 */
@ReactModule(name = NativeHeadlessJsTaskSupportSpec.NAME)
internal open class HeadlessJsTaskSupportModule(reactContext: ReactApplicationContext?) :
    NativeHeadlessJsTaskSupportSpec(reactContext) {
  override fun notifyTaskRetry(taskIdDouble: Double, promise: Promise) {
    val taskId = taskIdDouble.toInt()
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactApplicationContext)
    if (headlessJsTaskContext.isTaskRunning(taskId)) {
      val retryPosted = headlessJsTaskContext.retryTask(taskId)
      promise.resolve(retryPosted)
    } else {
      FLog.w(
          HeadlessJsTaskSupportModule::class.java,
          "Tried to retry non-active task with id %d. Did it time out?",
          taskId)
      promise.resolve(false)
    }
  }

  override fun notifyTaskFinished(taskIdDouble: Double) {
    val taskId = taskIdDouble.toInt()
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactApplicationContext)
    if (headlessJsTaskContext.isTaskRunning(taskId)) {
      headlessJsTaskContext.finishTask(taskId)
    } else {
      FLog.w(
          HeadlessJsTaskSupportModule::class.java,
          "Tried to finish non-active task with id %d. Did it time out?",
          taskId)
    }
  }

  companion object {
    const val NAME: String = NativeHeadlessJsTaskSupportSpec.NAME
  }
}
