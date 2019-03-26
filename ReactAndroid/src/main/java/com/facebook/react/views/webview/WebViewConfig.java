/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.webview;

import android.webkit.WebView;

/**
 * Implement this interface in order to config your {@link WebView}. An instance of that
 * implementation will have to be given as a constructor argument to {@link ReactWebViewManager}.
 */
public interface WebViewConfig {

  void configWebView(WebView webView);
}
