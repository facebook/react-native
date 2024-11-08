/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.network

import okhttp3.Dispatcher
import okhttp3.OkHttpClient

/**
 * Helper class that provides the necessary methods for canceling queued and running OkHttp calls
 */
internal object OkHttpCallUtil {
  @JvmStatic
  public fun cancelTag(client: OkHttpClient, tag: Any) {
    // client.dispatcher is private, so we need to use reflection to access
    // it via method dispatcher() otherwise we will get a compile error:
    // Using 'dispatcher(): Dispatcher' is an error. moved to val
    val dispatcherMethod = OkHttpClient::class.java.getMethod("dispatcher")
    dispatcherMethod.setAccessible(true)
    val dispatcher = dispatcherMethod.invoke(client) as Dispatcher
    for (call in dispatcher.queuedCalls()) {
      if (tag == call.request().tag()) {
        call.cancel()
        return
      }
    }
    for (call in dispatcher.runningCalls()) {
      if (tag == call.request().tag()) {
        call.cancel()
        return
      }
    }
  }
}
