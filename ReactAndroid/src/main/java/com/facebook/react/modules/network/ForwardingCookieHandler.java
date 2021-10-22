/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.text.TextUtils;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
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

  private final CookieSaver mCookieSaver;
  private final ReactContext mContext;
  private @Nullable CookieManager mCookieManager;

  public ForwardingCookieHandler(ReactContext context) {
    mContext = context;
    mCookieSaver = new CookieSaver();
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
    clearCookiesAsync(callback);
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private void clearCookiesAsync(final Callback callback) {
    CookieManager cookieManager = getCookieManager();
    if (cookieManager != null) {
      cookieManager.removeAllCookies(
          new ValueCallback<Boolean>() {
            @Override
            public void onReceiveValue(Boolean value) {
              mCookieSaver.onCookiesModified();
              callback.invoke(value);
            }
          });
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
    mCookieSaver.onCookiesModified();
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private void addCookieAsync(String url, String cookie) {
    CookieManager cookieManager = getCookieManager();
    if (cookieManager != null) {
      cookieManager.setCookie(url, cookie, null);
    }
  }

  private static boolean isCookieHeader(String name) {
    return name.equalsIgnoreCase(VERSION_ZERO_HEADER) || name.equalsIgnoreCase(VERSION_ONE_HEADER);
  }

  private void runInBackground(final Runnable runnable) {
    new GuardedAsyncTask<Void, Void>(mContext) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        runnable.run();
      }
    }.execute();
  }

  /**
   * Instantiating CookieManager will load the Chromium task taking a 100ish ms so we do it lazily
   * to make sure it's done on a background thread as needed.
   */
  private @Nullable CookieManager getCookieManager() {
    if (mCookieManager == null) {
      possiblyWorkaroundSyncManager(mContext);
      try {
        mCookieManager = CookieManager.getInstance();
      } catch (IllegalArgumentException ex) {
        // https://bugs.chromium.org/p/chromium/issues/detail?id=559720
        return null;
      } catch (Exception exception) {
        String message = exception.getMessage();
        // We cannot catch MissingWebViewPackageException as it is in a private / system API
        // class. This validates the exception's message to ensure we are only handling this
        // specific exception.
        // https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/webkit/WebViewFactory.java#348
        if (message != null
            && exception.getClass().getCanonicalName().contains("MissingWebViewPackageException")) {
          return null;
        } else {
          throw exception;
        }
      }
    }

    return mCookieManager;
  }

  private static void possiblyWorkaroundSyncManager(Context context) {}

  /**
   * Responsible for flushing cookies to disk. Flushes to disk with a maximum delay of 30 seconds.
   * This class is only active if we are on API < 21.
   */
  private class CookieSaver {
    private static final int MSG_PERSIST_COOKIES = 1;

    private static final int TIMEOUT = 30 * 1000; // 30 seconds

    private final Handler mHandler;

    public CookieSaver() {
      mHandler =
          new Handler(
              Looper.getMainLooper(),
              new Handler.Callback() {
                @Override
                public boolean handleMessage(Message msg) {
                  if (msg.what == MSG_PERSIST_COOKIES) {
                    persistCookies();
                    return true;
                  } else {
                    return false;
                  }
                }
              });
    }

    public void onCookiesModified() {}

    public void persistCookies() {
      mHandler.removeMessages(MSG_PERSIST_COOKIES);
      runInBackground(
          new Runnable() {
            @Override
            public void run() {
              flush();
            }
          });
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private void flush() {
      CookieManager cookieManager = getCookieManager();
      if (cookieManager != null) {
        cookieManager.flush();
      }
    }
  }
}
