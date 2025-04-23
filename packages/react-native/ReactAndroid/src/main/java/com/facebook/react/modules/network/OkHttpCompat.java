/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import java.util.Collections;
import java.util.Map;
import okhttp3.Headers;
import okhttp3.OkHttpClient;

/**
 * Helper class that provides wrappers for compatibility between different OkHttp versions.
 *
 * <p>This is required for Kotlin code compatibility, in particular, therefore if you are going to
 * migrate this file to Kotlin, please first ensure that there is no OkHttp API discrepancy between
 * different RN platform environments, and then consider getting rid of this compat layer
 * altogether.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class OkHttpCompat {
  public static CookieJarContainer getCookieJarContainer(OkHttpClient client) {
    return (CookieJarContainer) client.cookieJar();
  }

  public static Headers getHeadersFromMap(@Nullable Map<String, String> headers) {
    if (headers == null) {
      return Headers.of(Collections.emptyMap());
    } else {
      return Headers.of(headers);
    }
  }
}
