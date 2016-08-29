/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p/>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.webview;

import android.annotation.SuppressLint;
import android.text.TextUtils;
import android.webkit.WebView;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.uimanager.ThemedReactContext;

import javax.annotation.Nullable;

/**
 * Subclass of {@link WebView} that implements {@link LifecycleEventListener} interface in order
 * to call {@link WebView#destroy} on activity destroy event and also to clear the client
 */
@SuppressLint("ViewConstructor")
public class ReactWebView extends WebView implements LifecycleEventListener {
  private
  @Nullable
  String injectedJS;

  /**
   * WebView must be created with an context of the current activity
   * <p/>
   * Activity Context is required for creation of dialogs internally by WebView
   * Reactive Native needed for access to ReactNative internal system functionality
   */
  public ReactWebView(ThemedReactContext reactContext) {
    super(reactContext);
  }

  @Override
  public void onHostResume() {
    // do nothing
  }

  @Override
  public void onHostPause() {
    // do nothing
  }

  @Override
  public void onHostDestroy() {
    cleanupCallbacksAndDestroy();
  }

  public void setInjectedJavaScript(@Nullable String js) {
    injectedJS = js;
  }

  public void callInjectedJavaScript() {
    if (getSettings().getJavaScriptEnabled() &&
            injectedJS != null &&
            !TextUtils.isEmpty(injectedJS)) {
      loadUrl("javascript:(function() {\n" + injectedJS + ";\n})();");
    }
  }

  public void cleanupCallbacksAndDestroy() {
    setWebViewClient(null);
    destroy();
  }
}
