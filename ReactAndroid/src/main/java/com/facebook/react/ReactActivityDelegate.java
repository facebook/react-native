// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
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
  private final @Nullable FragmentActivity mFragmentActivity;
  private final @Nullable String mMainComponentName;

  @Nullable
  private final String mMainComponentName;

  private ReactDelegate mReactDelegate;

  @Nullable
  private PermissionListener mPermissionListener;

  @Nullable
  private Callback mPermissionsCallback;

  public ReactActivityDelegate(Activity activity, @Nullable String mainComponentName) {
    mActivity = activity;
    mMainComponentName = mainComponentName;
    mFragmentActivity = null;
  }

  public ReactActivityDelegate(
    FragmentActivity fragmentActivity,
    @Nullable String mainComponentName) {
    mFragmentActivity = fragmentActivity;
    mMainComponentName = mainComponentName;
    mActivity = null;
  }

  protected
  @Nullable
  Bundle getLaunchOptions() {
    return null;
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
    return mReactDelegate.getReactInstanceManager();
  }

  protected void onCreate(Bundle savedInstanceState) {
    mReactDelegate = new ReactDelegate(getPlainActivity(), mMainComponentName, getLaunchOptions());
    boolean needToEnableRedboxPermission = mReactDelegate.askForRedboxPermission();

    if (mMainComponentName != null && !needToEnableRedboxPermission) {
      mReactDelegate.loadApp();
      getPlainActivity().setContentView(mReactDelegate.getReactRootView());
    }
  }

  protected void loadApp(String appKey) {
    mReactDelegate.loadApp(appKey);
    getPlainActivity().setContentView(mReactDelegate.getReactRootView());
  }

  protected void onPause() {
    mReactDelegate.onHostPause();
  }

  protected void onResume() {
    mReactDelegate.onHostResume();

    if (mPermissionsCallback != null) {
      mPermissionsCallback.invoke();
      mPermissionsCallback = null;
    }
  }

  protected void onDestroy() {
    mReactDelegate.onHostDestroy();
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    mReactDelegate.onActivityResult(requestCode, resultCode, data, true);
  }

  public boolean onKeyUp(int keyCode, KeyEvent event) {
    return mReactDelegate.shouldShowDevMenuOrReload(keyCode, event);
  }

  public boolean onBackPressed() {
    return mReactDelegate.onBackPressed();
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

  private Context getContext() {
    if (mActivity != null) {
      return mActivity;
    }
    return Assertions.assertNotNull(mFragmentActivity);
  }

  private Activity getPlainActivity() {
    return ((Activity) getContext());
  }
}
