/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.webview;

import javax.annotation.Nullable;

import java.util.Map;

import android.graphics.Bitmap;
import android.os.Build;
import android.os.SystemClock;
import android.text.TextUtils;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.facebook.catalyst.views.webview.events.TopLoadingErrorEvent;
import com.facebook.catalyst.views.webview.events.TopLoadingFinishEvent;
import com.facebook.catalyst.views.webview.events.TopLoadingStartEvent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * Manages instances of {@link WebView}
 *
 * Can accept following commands:
 *  - GO_BACK
 *  - GO_FORWARD
 *  - RELOAD
 *
 * {@link WebView} instances could emit following direct events:
 *  - topLoadingFinish
 *  - topLoadingStart
 *  - topLoadingError
 *
 * Each event will carry the following properties:
 *  - target - view's react tag
 *  - url - url set for the webview
 *  - loading - whether webview is in a loading state
 *  - title - title of the current page
 *  - canGoBack - boolean, whether there is anything on a history stack to go back
 *  - canGoForward - boolean, whether it is possible to request GO_FORWARD command
 */
public class ReactWebViewManager extends SimpleViewManager<WebView> {

  private static final String REACT_CLASS = "RCTWebView";

  private static final String HTML_ENCODING = "UTF-8";
  private static final String HTML_MIME_TYPE = "text/html";

  public static final int COMMAND_GO_BACK = 1;
  public static final int COMMAND_GO_FORWARD = 2;
  public static final int COMMAND_RELOAD = 3;

  // Use `webView.loadUrl("about:blank")` to reliably reset the view
  // state and release page resources (including any running JavaScript).
  private static final String BLANK_URL = "about:blank";

  private WebViewConfig mWebViewConfig;

  static {
    if (ReactBuildConfig.DEBUG && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      // TODO(T9455950): re-enable debugging
      // WebView.setWebContentsDebuggingEnabled(true);
    }
  }

  private static class ReactWebViewClient extends WebViewClient {

    private boolean mLastLoadFailed = false;

    @Override
    public void onPageFinished(WebView webView, String url) {
      super.onPageFinished(webView, url);

      if (!mLastLoadFailed) {
        ReactWebView reactWebView = (ReactWebView) webView;
        reactWebView.callInjectedJavaScript();
        emitFinishEvent(webView, url);
      }
    }

    @Override
    public void onPageStarted(WebView webView, String url, Bitmap favicon) {
      super.onPageStarted(webView, url, favicon);
      mLastLoadFailed = false;

      ReactContext reactContext = (ReactContext) ((ReactWebView) webView).getContext();
      EventDispatcher eventDispatcher =
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
      eventDispatcher.dispatchEvent(
          new TopLoadingStartEvent(
              webView.getId(),
              SystemClock.uptimeMillis(),
              createWebViewEvent(webView, url)));
    }

    @Override
    public void onReceivedError(
        WebView webView,
        int errorCode,
        String description,
        String failingUrl) {
      super.onReceivedError(webView, errorCode, description, failingUrl);
      mLastLoadFailed = true;

      // In case of an error JS side expect to get a finish event first, and then get an error event
      // Android WebView does it in the opposite way, so we need to simulate that behavior
      emitFinishEvent(webView, failingUrl);

      ReactContext reactContext = (ReactContext) ((ReactWebView) webView).getContext();
      WritableMap eventData = createWebViewEvent(webView, failingUrl);
      eventData.putDouble("code", errorCode);
      eventData.putString("description", description);

      EventDispatcher eventDispatcher =
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
      eventDispatcher.dispatchEvent(
          new TopLoadingErrorEvent(webView.getId(), SystemClock.uptimeMillis(), eventData));
    }

    @Override
    public void doUpdateVisitedHistory(WebView webView, String url, boolean isReload) {
      super.doUpdateVisitedHistory(webView, url, isReload);

      ReactContext reactContext = (ReactContext) webView.getContext();
      EventDispatcher eventDispatcher =
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
      eventDispatcher.dispatchEvent(
          new TopLoadingStartEvent(
              webView.getId(),
              SystemClock.uptimeMillis(),
              createWebViewEvent(webView, url)));
    }

    private void emitFinishEvent(WebView webView, String url) {
      ReactContext reactContext = (ReactContext) webView.getContext();

      EventDispatcher eventDispatcher =
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
      eventDispatcher.dispatchEvent(
          new TopLoadingFinishEvent(
              webView.getId(),
              SystemClock.uptimeMillis(),
              createWebViewEvent(webView, url)));
    }

    private WritableMap createWebViewEvent(WebView webView, String url) {
      WritableMap event = Arguments.createMap();
      event.putDouble("target", webView.getId());
      // Don't use webView.getUrl() here, the URL isn't updated to the new value yet in callbacks
      // like onPageFinished
      event.putString("url", url);
      event.putBoolean("loading", !mLastLoadFailed && webView.getProgress() != 100);
      event.putString("title", webView.getTitle());
      event.putBoolean("canGoBack", webView.canGoBack());
      event.putBoolean("canGoForward", webView.canGoForward());
      return event;
    }
  }

  /**
   * Subclass of {@link WebView} that implements {@link LifecycleEventListener} interface in order
   * to call {@link WebView#destroy} on activty destroy event and also to clear the client
   */
  private static class ReactWebView extends WebView implements LifecycleEventListener {
    private @Nullable String injectedJS;

    /**
     * WebView must be created with an context of the current activity
     *
     * Activity Context is required for creation of dialogs internally by WebView
     * Reactive Native needed for access to ReactNative internal system functionality
     *
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
      if (
          getSettings().getJavaScriptEnabled() &&
              injectedJS != null &&
              !TextUtils.isEmpty(injectedJS)) {
        loadUrl("javascript:(function() {\n" + injectedJS + ";\n})();");
      }
    }

    private void cleanupCallbacksAndDestroy() {
      setWebViewClient(null);
      destroy();
    }
  }

  public ReactWebViewManager() {
    mWebViewConfig = new WebViewConfig() {
      public void configWebView(WebView webView) {
      }
    };
  }

  public ReactWebViewManager(WebViewConfig webViewConfig) {
    mWebViewConfig = webViewConfig;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected WebView createViewInstance(ThemedReactContext reactContext) {
    ReactWebView webView = new ReactWebView(reactContext);
    reactContext.addLifecycleEventListener(webView);
    mWebViewConfig.configWebView(webView);
    return webView;
  }

  @ReactProp(name = "javaScriptEnabledAndroid")
  public void setJavaScriptEnabled(WebView view, boolean enabled) {
    view.getSettings().setJavaScriptEnabled(enabled);
  }

  @ReactProp(name = "userAgent")
  public void setUserAgent(WebView view, @Nullable String userAgent) {
    if (userAgent != null) {
      // TODO(8496850): Fix incorrect behavior when property is unset (uA == null)
      view.getSettings().setUserAgentString(userAgent);
    }
  }

  @ReactProp(name = "injectedJavaScript")
  public void setInjectedJavaScript(WebView view, @Nullable String injectedJavaScript) {
    ((ReactWebView) view).setInjectedJavaScript(injectedJavaScript);
  }

  @ReactProp(name = "html")
  public void setHtml(WebView view, @Nullable String html) {
    if (html != null) {
      view.loadData(html, HTML_MIME_TYPE, HTML_ENCODING);
    } else {
      view.loadUrl(BLANK_URL);
    }
  }

  @ReactProp(name = "url")
  public void setUrl(WebView view, @Nullable String url) {
    // TODO(8495359): url and html are coupled as they both call loadUrl, therefore in case when
    // property url is removed in favor of property html being added in single transaction we may
    // end up in a state when blank url is loaded as it depends on the order of update operations!
    if (url != null) {
      view.loadUrl(url);
    } else {
      view.loadUrl(BLANK_URL);
    }
  }

  @Override
  protected void addEventEmitters(ThemedReactContext reactContext, WebView view) {
    // Do not register default touch emitter and let WebView implementation handle touches
    view.setWebViewClient(new ReactWebViewClient());
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
        "goBack", COMMAND_GO_BACK,
        "goForward", COMMAND_GO_FORWARD,
        "reload", COMMAND_RELOAD);
  }

  @Override
  public void receiveCommand(WebView root, int commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case COMMAND_GO_BACK:
        root.goBack();
        break;
      case COMMAND_GO_FORWARD:
        root.goForward();
        break;
      case COMMAND_RELOAD:
        root.reload();
        break;
    }
  }

  @Override
  public void onDropViewInstance(ThemedReactContext reactContext, WebView webView) {
    super.onDropViewInstance(reactContext, webView);
    reactContext.removeLifecycleEventListener((ReactWebView) webView);
    ((ReactWebView) webView).cleanupCallbacksAndDestroy();
  }
}
