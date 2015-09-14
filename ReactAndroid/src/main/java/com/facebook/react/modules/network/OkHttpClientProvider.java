/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import java.util.concurrent.TimeUnit;
import com.squareup.okhttp.OkHttpClient;

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public class OkHttpClientProvider {

  // Centralized OkHttpClient for all networking requests.
  private static OkHttpClient sClient;

  public static OkHttpClient getOkHttpClient() {
    if (sClient == null) {
      // TODO: #7108751 plug in stetho
      sClient = new OkHttpClient();

      // No timeouts by default
      sClient.setConnectTimeout(0, TimeUnit.MILLISECONDS);
      sClient.setReadTimeout(0, TimeUnit.MILLISECONDS);
      sClient.setWriteTimeout(0, TimeUnit.MILLISECONDS);
    }
    return sClient;
  }
}
