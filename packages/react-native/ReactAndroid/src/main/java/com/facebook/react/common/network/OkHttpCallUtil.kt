/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.network

import okhttp3.OkHttpClient

/**
 * Helper class that provides the necessary methods for canceling queued and running OkHttp calls
 */
public object OkHttpCallUtil {

  @JvmStatic
  public fun cancelTag(client: OkHttpClient, tag: Any) {
    client.dispatcher().queuedCalls().forEach { call ->
      if (tag == call.request().tag()) {
        call.cancel()
        return@forEach
      }
    }
    client.dispatcher().runningCalls().forEach { call ->
      if (tag == call.request().tag()) {
        call.cancel()
        return@forEach
      }
    }
  }
}
