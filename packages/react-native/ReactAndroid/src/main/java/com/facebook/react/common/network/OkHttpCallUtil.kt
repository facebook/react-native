/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.common.network

import okhttp3.OkHttpClient

/**
 * Helper class that provides the necessary methods for canceling queued and running OkHttp calls
 */
internal object OkHttpCallUtil {
  @JvmStatic
  fun cancelTag(client: OkHttpClient, tag: Any) {
    val dispatcher = client.dispatcher()
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
