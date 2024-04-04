/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.network;

import com.facebook.infer.annotation.Nullsafe;
import okhttp3.Call;
import okhttp3.OkHttpClient;

/**
 * Helper class that provides the necessary methods for canceling queued and running OkHttp calls
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class OkHttpCallUtil {

  private OkHttpCallUtil() {}

  public static void cancelTag(OkHttpClient client, Object tag) {
    for (Call call : client.dispatcher().queuedCalls()) {
      if (tag.equals(call.request().tag())) {
        call.cancel();
        return;
      }
    }
    for (Call call : client.dispatcher().runningCalls()) {
      if (tag.equals(call.request().tag())) {
        call.cancel();
        return;
      }
    }
  }
}
