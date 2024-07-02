/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import android.webkit.CookieManager
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactContext
import java.io.IOException
import java.net.CookieHandler
import java.net.URI
import java.util.Collections

/**
 * Cookie handler that forwards all cookies to the WebView CookieManager.
 *
 * This class relies on CookieManager to persist cookies to disk so cookies may be lost if the
 * application is terminated before it syncs.
 */
@Suppress("UNUSED_PARAMETER")
public class ForwardingCookieHandler(context: ReactContext) : CookieHandler() {

  private var _cookieManager: CookieManager? = null

  @Throws(IOException::class)
  override fun get(uri: URI, headers: Map<String?, List<String?>?>?): Map<String, List<String?>> {
    val cookies = cookieManager?.getCookie(uri.toString())
    return if (cookies.isNullOrEmpty()) {
      Collections.emptyMap()
    } else {
      mapOf(COOKIE_HEADER to listOf(cookies))
    }
  }

  @Throws(IOException::class)
  override fun put(uri: URI?, headers: Map<String?, List<String?>>) {
    val url = uri.toString()
    headers.forEach { entry ->
      if (entry.key.isCookieHeader) {
        addCookies(url, entry.value)
      }
    }
  }

  public fun clearCookies(callback: Callback) {
    cookieManager?.removeAllCookies { value -> callback.invoke(value) }
  }

  public fun destroy(): Unit = Unit

  public fun addCookies(url: String?, cookies: List<String?>) {
    val manager = cookieManager ?: return
    cookies.forEach { cookie -> addCookieAsync(url, cookie) }
    manager.flush()
  }

  private fun addCookieAsync(url: String?, cookie: String?) {
    cookieManager?.setCookie(url, cookie, null)
  }

  private val cookieManager: CookieManager?
    /**
     * Instantiating CookieManager will load the Chromium task taking a 100ish ms so we do it lazily
     * to make sure it's done on a background thread as needed.
     */
    @Suppress("CatchGeneralException")
    get() {
      if (_cookieManager == null) {
        _cookieManager =
            try {
              CookieManager.getInstance()
            } catch (ex: IllegalArgumentException) {
              // https://bugs.chromium.org/p/chromium/issues/detail?id=559720
              null
            } catch (exception: Exception) {
              // Ideally we would like to catch a `MissingWebViewPackageException` here.
              // That API is private so we can't access it.
              // Historically we used string matching on the error message to understand
              // if the exception was a Missing Webview One.
              // OEMs have been customizing that message making really hard to catch it.
              // Therefore we result to returning null as a default instead of rethrowing
              // the exception as it will result in a app crash at runtime.
              // a) We will return null for all the other unhandled conditions when a webview
              // provider is
              // not found.
              // b) We already have null checks in place for `getCookieManager()` calls.
              // c) We have annotated the method as @Nullable to notify future devs about our return
              // type.
              null
            }
      }
      return _cookieManager
    }
}

private const val VERSION_ZERO_HEADER = "Set-cookie"
private const val VERSION_ONE_HEADER = "Set-cookie2"
private const val COOKIE_HEADER = "Cookie"

private val String?.isCookieHeader: Boolean
  get() {
    return this != null &&
        (equals(VERSION_ZERO_HEADER, ignoreCase = true) ||
            equals(VERSION_ONE_HEADER, ignoreCase = true))
  }
