/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import com.facebook.infer.annotation.Nullsafe
import okhttp3.Headers
import okhttp3.OkHttpClient

/**
 * Helper class that provides wrappers for compatibility between different OkHttp versions.
 *
 * This is required for Kotlin code compatibility, in particular, therefore if you are going to
 * migrate this file to Kotlin, please first ensure that there is no OkHttp API discrepancy between
 * different RN platform environments, and then consider getting rid of this compat layer
 * altogether.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public object OkHttpCompat {
  public fun getCookieJarContainer(client: OkHttpClient): CookieJarContainer =
      client.cookieJar() as CookieJarContainer

  public fun getHeadersFromMap(headers: Map<String, String>?): Headers =
      Headers.of(headers ?: emptyMap())
}
