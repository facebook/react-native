/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

import android.os.Looper
import com.facebook.react.bridge.queue.MessageQueueThreadImpl.Companion.create
import com.facebook.react.bridge.queue.MessageQueueThreadSpec.Companion.mainThreadSpec

public class ReactQueueConfigurationImpl
private constructor(
    private val uiQueueThread: MessageQueueThreadImpl,
    private val nativeModulesQueueThread: MessageQueueThreadImpl,
    private val jsQueueThread: MessageQueueThreadImpl
) : ReactQueueConfiguration {
  override fun getUIQueueThread(): MessageQueueThread = uiQueueThread

  override fun getNativeModulesQueueThread(): MessageQueueThread = nativeModulesQueueThread

  override fun getJSQueueThread(): MessageQueueThread = jsQueueThread

  /**
   * Should be called when the corresponding [com.facebook.react.bridge.CatalystInstance] is
   * destroyed so that we shut down the proper queue threads.
   */
  override fun destroy() {
    if (nativeModulesQueueThread.looper != Looper.getMainLooper()) {
      nativeModulesQueueThread.quitSynchronous()
    }
    if (jsQueueThread.looper != Looper.getMainLooper()) {
      jsQueueThread.quitSynchronous()
    }
  }

  public companion object {
    @JvmStatic
    public fun create(
        spec: ReactQueueConfigurationSpec,
        exceptionHandler: QueueThreadExceptionHandler
    ): ReactQueueConfigurationImpl {
      val uiThread = create(mainThreadSpec(), exceptionHandler)
      val jsThread = create(spec.jSQueueThreadSpec, exceptionHandler)
      val nativeModulesThread = create(spec.nativeModulesQueueThreadSpec, exceptionHandler)
      return ReactQueueConfigurationImpl(uiThread, nativeModulesThread, jsThread)
    }
  }
}
