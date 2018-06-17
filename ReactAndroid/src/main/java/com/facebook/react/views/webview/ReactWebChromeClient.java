package com.facebook.react.views.webview;

import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.build.ReactBuildConfig;

import static android.view.ViewGroup.LayoutParams;

/**
 * Wrapper Client for {@link WebChromeClient}. It overrides methods for geolocation permissions,
 * console messages (which were previously overwritten ad hoc in {@link ReactWebViewManager}) and
 * onShowCustomView and onHideCustomView for handling fullscreen view
 */
public class ReactWebChromeClient extends WebChromeClient {

  private final FrameLayout.LayoutParams FULLSCREEN_LAYOUT_PARAMS = new FrameLayout.LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER);

  private WebChromeClient.CustomViewCallback mCustomViewCallback;
  private View mFullScreenView;
  private ReactContext mReactContext;

  public ReactWebChromeClient(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public boolean onConsoleMessage(ConsoleMessage message) {
    if (ReactBuildConfig.DEBUG) {
      return super.onConsoleMessage(message);
    }
    // Ignore console logs in non debug builds.
    return true;
  }

  @Override
  public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
    callback.invoke(origin, true, false);
  }

  @Override
  public void onShowCustomView(View view, CustomViewCallback callback) {
    if (mFullScreenView != null) {
      callback.onCustomViewHidden();
      return;
    }
    // Store the view for hiding handling
    mFullScreenView = view;
    mCustomViewCallback = callback;
    view.setBackgroundColor(Color.BLACK);
    getRootView().addView(view, FULLSCREEN_LAYOUT_PARAMS);
  }

  @Override
  public void onHideCustomView() {
    if (mFullScreenView == null) {
      return;
    }
    mFullScreenView.setVisibility(View.GONE);
    getRootView().removeView(mFullScreenView);
    mFullScreenView = null;
    mCustomViewCallback.onCustomViewHidden();
  }

  private ViewGroup getRootView() {
    return ((ViewGroup) mReactContext.getCurrentActivity().findViewById(android.R.id.content));
  }
}
