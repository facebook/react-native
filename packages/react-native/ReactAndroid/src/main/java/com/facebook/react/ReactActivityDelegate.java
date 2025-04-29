/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.interfaces.fabric.ReactSurface;
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.systrace.Systrace;

/**
 * Delegate class for {@link ReactActivity}. You can subclass this to provide custom implementations
 * for e.g. {@link #getReactNativeHost()}, if your Application class doesn't implement {@link
 * ReactApplication}.
 */
public class ReactActivityDelegate {

  private final @Nullable Activity mActivity;
  private final @Nullable String mMainComponentName;

  private @Nullable PermissionListener mPermissionListener;
  private @Nullable Callback mPermissionsCallback;
  private @Nullable ReactDelegate mReactDelegate;

  /**
   * Prefer using ReactActivity when possible, as it hooks up all Activity lifecycle methods by
   * default. It also implements DefaultHardwareBackBtnHandler, which ReactDelegate requires.
   */
  @Deprecated
  public ReactActivityDelegate(@Nullable Activity activity, @Nullable String mainComponentName) {
    mActivity = activity;
    mMainComponentName = mainComponentName;
  }

  public ReactActivityDelegate(
      @Nullable ReactActivity activity, @Nullable String mainComponentName) {
    mActivity = activity;
    mMainComponentName = mainComponentName;
  }

  /**
   * Public API to populate the launch options that will be passed to React. Here you can customize
   * the values that will be passed as `initialProperties` to the Renderer.
   *
   * @return Either null or a key-value map as a Bundle
   */
  protected @Nullable Bundle getLaunchOptions() {
    return null;
  }

  protected @Nullable Bundle composeLaunchOptions() {
    return getLaunchOptions();
  }

  /**
   * Override to customize ReactRootView creation.
   *
   * <p>Not used on bridgeless
   */
  protected @Nullable ReactRootView createRootView() {
    return null;
  }

  /**
   * Get the {@link ReactNativeHost} used by this app with Bridge enabled. By default, assumes
   * {@link Activity#getApplication()} is an instance of {@link ReactApplication} and calls {@link
   * ReactApplication#getReactNativeHost()}. Override this method if your application class does not
   * implement {@code ReactApplication} or you simply have a different mechanism for storing a
   * {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  @DeprecatedInNewArchitecture(message = "Use getReactHost()")
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) getPlainActivity().getApplication()).getReactNativeHost();
  }

  /**
   * Get the {@link ReactHost} used by this app with Bridgeless enabled. By default, assumes {@link
   * Activity#getApplication()} is an instance of {@link ReactApplication} and calls {@link
   * ReactApplication#getReactHost()}. Override this method if your application class does not
   * implement {@code ReactApplication} or you simply have a different mechanism for storing a
   * {@code ReactHost}, e.g. as a static field somewhere.
   */
  public @Nullable ReactHost getReactHost() {
    return ((ReactApplication) getPlainActivity().getApplication()).getReactHost();
  }

  protected @Nullable ReactDelegate getReactDelegate() {
    return mReactDelegate;
  }

  @DeprecatedInNewArchitecture(message = "Use getReactHost()")
  public ReactInstanceManager getReactInstanceManager() {
    return mReactDelegate.getReactInstanceManager();
  }

  public String getMainComponentName() {
    return mMainComponentName;
  }

  public void onCreate(Bundle savedInstanceState) {
    Systrace.traceSection(
        Systrace.TRACE_TAG_REACT,
        "ReactActivityDelegate.onCreate::init",
        () -> {
          String mainComponentName = getMainComponentName();
          final Bundle launchOptions = composeLaunchOptions();
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isWideColorGamutEnabled()) {
            mActivity.getWindow().setColorMode(ActivityInfo.COLOR_MODE_WIDE_COLOR_GAMUT);
          }
          if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
            mReactDelegate =
                new ReactDelegate(
                    getPlainActivity(), getReactHost(), mainComponentName, launchOptions);
          } else {
            mReactDelegate =
                new ReactDelegate(
                    getPlainActivity(),
                    getReactNativeHost(),
                    mainComponentName,
                    launchOptions,
                    isFabricEnabled()) {
                  @Override
                  protected ReactRootView createRootView() {
                    ReactRootView rootView = ReactActivityDelegate.this.createRootView();
                    if (rootView == null) {
                      rootView = super.createRootView();
                    }
                    return rootView;
                  }
                };
          }
          if (mainComponentName != null) {
            loadApp(mainComponentName);
          }
        });
  }

  protected void loadApp(String appKey) {
    mReactDelegate.loadApp(appKey);
    getPlainActivity().setContentView(mReactDelegate.getReactRootView());
  }

  public void setReactSurface(ReactSurface reactSurface) {
    mReactDelegate.setReactSurface(reactSurface);
  }

  public void setReactRootView(ReactRootView reactRootView) {
    mReactDelegate.setReactRootView(reactRootView);
  }

  public void onUserLeaveHint() {
    if (mReactDelegate != null) {
      mReactDelegate.onUserLeaveHint();
    }
  }

  public void onPause() {
    mReactDelegate.onHostPause();
  }

  public void onResume() {
    mReactDelegate.onHostResume();

    if (mPermissionsCallback != null) {
      mPermissionsCallback.invoke();
      mPermissionsCallback = null;
    }
  }

  public void onDestroy() {
    mReactDelegate.onHostDestroy();
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    mReactDelegate.onActivityResult(requestCode, resultCode, data, true);
  }

  public boolean onKeyDown(int keyCode, KeyEvent event) {
    return mReactDelegate.onKeyDown(keyCode, event);
  }

  public boolean onKeyUp(int keyCode, KeyEvent event) {
    return mReactDelegate.shouldShowDevMenuOrReload(keyCode, event);
  }

  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    return mReactDelegate.onKeyLongPress(keyCode);
  }

  public boolean onBackPressed() {
    return mReactDelegate.onBackPressed();
  }

  public boolean onNewIntent(Intent intent) {
    return mReactDelegate.onNewIntent(intent);
  }

  public void onWindowFocusChanged(boolean hasFocus) {
    mReactDelegate.onWindowFocusChanged(hasFocus);
  }

  public void onConfigurationChanged(Configuration newConfig) {
    mReactDelegate.onConfigurationChanged(newConfig);
  }

  public void requestPermissions(
      String[] permissions, int requestCode, PermissionListener listener) {
    mPermissionListener = listener;
    getPlainActivity().requestPermissions(permissions, requestCode);
  }

  public void onRequestPermissionsResult(
      final int requestCode, final String[] permissions, final int[] grantResults) {
    mPermissionsCallback =
        args -> {
          if (mPermissionListener != null
              && mPermissionListener.onRequestPermissionsResult(
                  requestCode, permissions, grantResults)) {
            mPermissionListener = null;
          }
        };
  }

  protected Context getContext() {
    return Assertions.assertNotNull(mActivity);
  }

  protected Activity getPlainActivity() {
    return ((Activity) getContext());
  }

  protected ReactActivity getReactActivity() {
    return ((ReactActivity) getContext());
  }

  /**
   * Get the current {@link ReactContext} from ReactHost or ReactInstanceManager
   *
   * <p>Do not store a reference to this, if the React instance is reloaded or destroyed, this
   * context will no longer be valid.
   */
  public @Nullable ReactContext getCurrentReactContext() {
    return mReactDelegate.getCurrentReactContext();
  }

  /**
   * Override this method if you wish to selectively toggle Fabric for a specific surface. This will
   * also control if Concurrent Root (React 18) should be enabled or not.
   *
   * @return true if Fabric is enabled for this Activity, false otherwise.
   */
  protected boolean isFabricEnabled() {
    return ReactNativeNewArchitectureFeatureFlags.enableFabricRenderer();
  }

  /**
   * Override this method if you wish to selectively toggle wide color gamut for a specific surface.
   *
   * @return true if wide gamut is enabled for this Activity, false otherwise.
   */
  protected boolean isWideColorGamutEnabled() {
    return false;
  }
}
