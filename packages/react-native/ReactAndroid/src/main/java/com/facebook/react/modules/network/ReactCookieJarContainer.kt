/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import java.util.ArrayList
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.Headers
import okhttp3.HttpUrl

/** Basic okhttp3 CookieJar container */
public class ReactCookieJarContainer : CookieJarContainer {

  private var cookieJar: CookieJar? = null

  override fun setCookieJar(cookieJar: CookieJar) {
    this.cookieJar = cookieJar
  }

  override fun removeCookieJar() {
    cookieJar = null
  }

  override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
    cookieJar?.saveFromResponse(url, cookies)
  }

  override fun loadForRequest(url: HttpUrl): List<Cookie> {
    val cookieJar = cookieJar ?: return emptyList()
    val cookies = cookieJar.loadForRequest(url)
    val validatedCookies = ArrayList<Cookie>()
    for (cookie in cookies) {
      try {
        val cookieChecker = Headers.Builder()
        cookieChecker.add(cookie.name(), cookie.value())
        validatedCookies.add(cookie)
      } catch (ignored: IllegalArgumentException) {}
    }
    return validatedCookies
  }
}
