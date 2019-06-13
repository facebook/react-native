// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Callback;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionListener;

import javax.annotation.Nullable;

/**
 * Delegate class for {@link ReactActivity} and {@link ReactFragmentActivity}. You can subclass this
 * to provide custom implementations for e.g. {@link #getReactNativeHost()}, if your Application
 * class doesn't implement {@link ReactApplication}.
 */
public class ReactActivityDelegate {

  private final @Nullable Activity mActivity;
  private final @Nullable String mMainComponentName;

  private @Nullable ReactRootView mReactRootView;
  private @Nullable DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;
  private @Nullable PermissionListener mPermissionListener;
  private @Nullable Callback mPermissionsCallback;

  @Deprecated
  public ReactActivityDelegate(Activity activity, @Nullable String mainComponentName) {
    mActivity = activity;
    mMainComponentName = mainComponentName;
  }

  public ReactActivityDelegate(ReactActivity activity, @Nullable String mainComponentName) {
    mActivity = activity;
    mMainComponentName = mainComponentName;
  }

  protected @Nullable Bundle getLaunchOptions() {
    return null;
  }

  protected ReactRootView createRootView() {
    return new ReactRootView(getContext());
  }

  /**
   * Get the {@link ReactNativeHost} used by this app. By default, assumes
   * {@link Activity#getApplication()} is an instance of {@link ReactApplication} and calls
   * {@link ReactApplication#getReactNativeHost()}. Override this method if your application class
   * does not implement {@code ReactApplication} or you simply have a different mechanism for
   * storing a {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) getPlainActivity().getApplication()).getReactNativeHost();
  }

  public ReactInstanceManager getReactInstanceManager() {
    return getReactNativeHost().getReactInstanceManager();
  }

  protected void onCreate(Bundle savedInstanceState) {
    if (mMainComponentName != null) {
      loadApp(mMainComponentName);
    }
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
  }

  protected void loadApp(String appKey) {
    if (mReactRootView != null) {
      throw new IllegalStateException("Cannot loadApp while app is already running.");
    }
    mReactRootView = createRootView();
    mReactRootView.startReactApplication(
      getReactNativeHost().getReactInstanceManager(),
      appKey,
      getLaunchOptions());
    getPlainActivity().setContentView(mReactRootView);
  }

  protected void onPause() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostPause(getPlainActivity());
    }
  }

  protected void onResume() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostResume(
        getPlainActivity(),
        (DefaultHardwareBackBtnHandler) getPlainActivity());
    }

    if (mPermissionsCallback != null) {
      mPermissionsCallback.invoke();
      mPermissionsCallback = null;
    }
  }

  protected void onDestroy() {
    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
      mReactRootView = null;
    }
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostDestroy(getPlainActivity());
    }
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager()
        .onActivityResult(getPlainActivity(), requestCode, resultCode, data);
    }
  }

  public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (getReactNativeHost().hasInstance()
      && getReactNativeHost().getUseDeveloperSupport()
      && keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
      event.startTracking();
      return true;
    }
    return false;
  }

  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (getReactNativeHost().hasInstance() && getReactNativeHost().getUseDeveloperSupport()) {
      if (keyCode == KeyEvent.KEYCODE_MENU) {
        getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
        return true;
      }
      boolean didDoubleTapR = Assertions.assertNotNull(mDoubleTapReloadRecognizer)
        .didDoubleTapR(keyCode, getPlainActivity().getCurrentFocus());
      if (didDoubleTapR) {
        getReactNativeHost().getReactInstanceManager().getDevSupportManager().handleReloadJS();
        return true;
      }
    }
    return false;
  }

  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    if (getReactNativeHost().hasInstance()
        && getReactNativeHost().getUseDeveloperSupport()
        && keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
      getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
      return true;
    }
    return false;
  }

  public boolean onBackPressed() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onBackPressed();
      return true;
    }
    return false;
  }

  public boolean onNewIntent(Intent intent) {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onNewIntent(intent);
      return true;
    }
    return false;
  }

  @TargetApi(Build.VERSION_CODES.M)
  public void requestPermissions(
    String[] permissions,
    int requestCode,
    PermissionListener listener) {
    mPermissionListener = listener;
    getPlainActivity().requestPermissions(permissions, requestCode);
  }

  public void onRequestPermissionsResult(
    final int requestCode,
    final String[] permissions,
    final int[] grantResults) {
    mPermissionsCallback = new Callback() {
      @Override
      public void invoke(Object... args) {
        if (mPermissionListener != null && mPermissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
          mPermissionListener = null;
        }
      }
    };
  }

  protected Context getContext() {
    return Assertions.assertNotNull(mActivity);
  }

  protected Activity getPlainActivity() {
    return ((Activity) getContext());
  }
}
