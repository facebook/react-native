/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import javax.annotation.Nullable;

import java.util.concurrent.TimeUnit;

import com.squareup.okhttp.OkHttpClient;

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public class OkHttpClientProvider {

  // Centralized OkHttpClient for all networking requests.
  private static @Nullable OkHttpClient sClient;

  public static OkHttpClient getOkHttpClient() {
    if (sClient == null) {
      sClient = createClient();
    }
    return sClient;
  }

  private static OkHttpClient createClient() {
    OkHttpClient client = new OkHttpClient();

    // No timeouts by default
    client.setConnectTimeout(0, TimeUnit.MILLISECONDS);
    client.setReadTimeout(0, TimeUnit.MILLISECONDS);
    client.setWriteTimeout(0, TimeUnit.MILLISECONDS);

    return client;
  }
}
