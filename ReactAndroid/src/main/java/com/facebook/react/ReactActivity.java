/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import javax.annotation.Nullable;

import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.KeyEvent;
import android.widget.Toast;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

/**
 * Base Activity for React Native applications.
 */
public abstract class ReactActivity extends Activity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  private static final String REDBOX_PERMISSION_MESSAGE =
      "Overlay permissions needs to be granted in order for react native apps to run in dev mode";

  private @Nullable PermissionListener mPermissionListener;
  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable ReactRootView mReactRootView;
  private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;
  private boolean mDoRefresh = false;

  /**
   * Returns the launchOptions which will be passed to the {@link ReactInstanceManager}
   * when the application is started. By default, this will return null and an empty
   * object will be passed to your top level component as its initial props.
   * If your React Native application requires props set outside of JS, override
   * this method to return the Android.os.Bundle of your desired initial props.
   */
  protected @Nullable Bundle getLaunchOptions() {
    return null;
  }

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   * e.g. "MoviesApp"
   */
  protected abstract String getMainComponentName();

  /**
   * A subclass may override this method if it needs to use a custom {@link ReactRootView}.
   */
  protected ReactRootView createRootView() {
    return new ReactRootView(this);
  }

  /**
   * Get the {@link ReactNativeHost} used by this app. By default, assumes {@link #getApplication()}
   * is an instance of {@link ReactApplication} and calls
   * {@link ReactApplication#getReactNativeHost()}. Override this method if your application class
   * does not implement {@code ReactApplication} or you simply have a different mechanism for
   * storing a {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) getApplication()).getReactNativeHost();
  }

  /**
   * Get whether developer support should be enabled or not. By default this delegates to
   * {@link ReactNativeHost#getUseDeveloperSupport()}. Override this method if your application
   * class does not implement {@code ReactApplication} or you simply have a different logic for
   * determining this (default just checks {@code BuildConfig}).
   */
  protected boolean getUseDeveloperSupport() {
    return ((ReactApplication) getApplication()).getReactNativeHost().getUseDeveloperSupport();
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    if (getUseDeveloperSupport() && Build.VERSION.SDK_INT >= 23) {
      // Get permission to show redbox in dev builds.
      if (!Settings.canDrawOverlays(this)) {
        Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        startActivity(serviceIntent);
        FLog.w(ReactConstants.TAG, REDBOX_PERMISSION_MESSAGE);
        Toast.makeText(this, REDBOX_PERMISSION_MESSAGE, Toast.LENGTH_LONG).show();
      }
    }

    mReactRootView = createRootView();
    mReactRootView.startReactApplication(
      getReactNativeHost().getReactInstanceManager(),
      getMainComponentName(),
      getLaunchOptions());
    setContentView(mReactRootView);
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
  }

  @Override
  protected void onPause() {
    super.onPause();

    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostPause();
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
      mReactRootView = null;
    }
    getReactNativeHost().clear();
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager()
        .onActivityResult(requestCode, resultCode, data);
    }
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (getReactNativeHost().hasInstance() && getUseDeveloperSupport()) {
      if (keyCode == KeyEvent.KEYCODE_MENU) {
        getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
        return true;
      }
      if (mDoubleTapReloadRecognizer.didDoubleTapR(keyCode, getCurrentFocus())) {
        getReactNativeHost().getReactInstanceManager().getDevSupportManager().handleReloadJS();
      }
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onBackPressed();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    super.onBackPressed();
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onNewIntent(intent);
    } else {
      super.onNewIntent(intent);
    }
  }

  @Override
  public void requestPermissions(
      String[] permissions,
      int requestCode,
      PermissionListener listener) {
    mPermissionListener = listener;
    this.requestPermissions(permissions, requestCode);
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode,
      String[] permissions,
      int[] grantResults) {
    if (mPermissionListener != null &&
        mPermissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
      mPermissionListener = null;
    }
  }
}
