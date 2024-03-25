/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import android.text.TextUtils;
import android.webkit.CookieManager;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactContext;
import java.io.IOException;
import java.net.CookieHandler;
import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Cookie handler that forwards all cookies to the WebView CookieManager.
 *
 * <p>This class relies on CookieManager to persist cookies to disk so cookies may be lost if the
 * application is terminated before it syncs.
 */
public class ForwardingCookieHandler extends CookieHandler {
  private static final String VERSION_ZERO_HEADER = "Set-cookie";
  private static final String VERSION_ONE_HEADER = "Set-cookie2";
  private static final String COOKIE_HEADER = "Cookie";

  private final ReactContext mContext;
  private @Nullable CookieManager mCookieManager;

  public ForwardingCookieHandler(ReactContext context) {
    mContext = context;
  }

  @Override
  public Map<String, List<String>> get(URI uri, Map<String, List<String>> headers)
      throws IOException {
    CookieManager cookieManager = getCookieManager();
    if (cookieManager == null) return Collections.emptyMap();

    String cookies = cookieManager.getCookie(uri.toString());
    if (TextUtils.isEmpty(cookies)) {
      return Collections.emptyMap();
    }

    return Collections.singletonMap(COOKIE_HEADER, Collections.singletonList(cookies));
  }

  @Override
  public void put(URI uri, Map<String, List<String>> headers) throws IOException {
    String url = uri.toString();
    for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
      String key = entry.getKey();
      if (key != null && isCookieHeader(key)) {
        addCookies(url, entry.getValue());
      }
    }
  }

  public void clearCookies(final Callback callback) {
    CookieManager cookieManager = getCookieManager();
    if (cookieManager != null) {
      cookieManager.removeAllCookies(value -> callback.invoke(value));
    }
  }

  public void destroy() {}

  public void addCookies(final String url, final List<String> cookies) {
    final CookieManager cookieManager = getCookieManager();
    if (cookieManager == null) return;

    for (String cookie : cookies) {
      addCookieAsync(url, cookie);
    }
    cookieManager.flush();
  }

  private void addCookieAsync(String url, String cookie) {
    CookieManager cookieManager = getCookieManager();
    if (cookieManager != null) {
      cookieManager.setCookie(url, cookie, null);
    }
  }

  private static boolean isCookieHeader(String name) {
    return name.equalsIgnoreCase(VERSION_ZERO_HEADER) || name.equalsIgnoreCase(VERSION_ONE_HEADER);
  }

  /**
   * Instantiating CookieManager will load the Chromium task taking a 100ish ms so we do it lazily
   * to make sure it's done on a background thread as needed.
   */
  private @Nullable CookieManager getCookieManager() {
    if (mCookieManager == null) {
      try {
        mCookieManager = CookieManager.getInstance();
      } catch (IllegalArgumentException ex) {
        // https://bugs.chromium.org/p/chromium/issues/detail?id=559720
        return null;
      } catch (Exception exception) {
        // Ideally we would like to catch a `MissingWebViewPackageException` here.
        // That API is private so we can't access it.
        // Historically we used string matching on the error message to understand
        // if the exception was a Missing Webview One.
        // OEMs have been customizing that message making really hard to catch it.
        // Therefore we result to returning null as a default instead of rethrowing
        // the exception as it will result in a app crash at runtime.
        // a) We will return null for all the other unhandled conditions when a webview provider is
        // not found.
        // b) We already have null checks in place for `getCookieManager()` calls.
        // c) We have annotated the method as @Nullable to notify future devs about our return type.
        return null;
      }
    }

    return mCookieManager;
  }
}
