/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p/>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common.network;

import okhttp3.Call;
import okhttp3.OkHttpClient;

/**
 * Helper class that provides the necessary methods for canceling queued and running OkHttp calls
 */
public class OkHttpCallUtil {

  private OkHttpCallUtil() {
  }

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
