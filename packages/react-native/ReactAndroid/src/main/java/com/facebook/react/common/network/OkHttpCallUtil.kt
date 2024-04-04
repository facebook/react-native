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
    for (call in client.dispatcher.queuedCalls()) {
      if (tag == call.request().tag()) {
        call.cancel()
        return
      }
    }
    for (call in client.dispatcher.runningCalls()) {
      if (tag == call.request().tag()) {
        call.cancel()
        return
      }
    }
  }
}
