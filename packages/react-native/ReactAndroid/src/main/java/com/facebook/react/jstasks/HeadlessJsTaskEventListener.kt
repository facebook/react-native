/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jstasks

/** Listener interface for task lifecycle events. */
public interface HeadlessJsTaskEventListener {

  /**
   * Called when a JS task is started, on the UI thread.
   *
   * @param taskId the unique identifier of this task instance
   */
  public fun onHeadlessJsTaskStart(taskId: Int)

  /**
   * Called when a JS task finishes (i.e. when [HeadlessJsTaskSupportModule.notifyTaskFinished] is
   * called, or when it times out), on the UI thread.
   */
  public fun onHeadlessJsTaskFinish(taskId: Int)
}
