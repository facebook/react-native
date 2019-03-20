package com.facebook.react;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

import javax.annotation.Nullable;

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an {@link Activity} or a {@link android.app.Fragment}.
 */
public class ReactDelegate {

  private final Activity mActivity;
  private ReactRootView mReactRootView;


  @Nullable
  private final String mMainComponentName;

  @Nullable
  private Bundle mLaunchOptions;

  @Nullable
  private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;


  public ReactDelegate(Activity activity, String appKey, Bundle launchOptions) {
    mActivity = activity;
    mMainComponentName = appKey;
    mLaunchOptions = launchOptions;
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
  }

  public void onHostResume() {
    if (getReactNativeHost().hasInstance()) {
      if (mActivity instanceof DefaultHardwareBackBtnHandler) {
        getReactNativeHost().getReactInstanceManager().onHostResume(mActivity, (DefaultHardwareBackBtnHandler) mActivity);
      } else {
        throw new ClassCastException("Host Activity does not implement DefaultHardwareBackBtnHandler");
      }
    }
  }

  public void onHostPause() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostPause(mActivity);
    }
  }

  public void onHostDestroy() {
    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
      mReactRootView = null;
    }
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onHostDestroy(mActivity);
    }
  }

  public boolean onBackPressed() {
    if (getReactNativeHost().hasInstance()) {
      getReactNativeHost().getReactInstanceManager().onBackPressed();
      return true;
    }
    return false;
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data, boolean shouldForwardToReactInstance) {
    if (getReactNativeHost().hasInstance() && shouldForwardToReactInstance) {
      getReactNativeHost().getReactInstanceManager().onActivityResult(mActivity, requestCode, resultCode, data);
    }
  }

  public void loadApp() {
    loadApp(mMainComponentName);
  }

  public void loadApp(String appKey) {
    if (mReactRootView != null) {
      throw new IllegalStateException("Cannot loadApp while app is already running.");
    }
    mReactRootView = new ReactRootView(mActivity);
    mReactRootView.startReactApplication(
      getReactNativeHost().getReactInstanceManager(),
      appKey,
      mLaunchOptions);

  }

  public ReactRootView getReactRootView() {
    return mReactRootView;
  }

  /**
   * Handles delegating the {@link Activity#onKeyUp(int, KeyEvent)} method to determine whether
   * the application should show the developer menu or should reload the React Application.
   *
   * @return true if we consume the event and either shoed the develop menu or reloaded the application.
   */
  public boolean shouldShowDevMenuOrReload(int keyCode, KeyEvent event) {
    if (getReactNativeHost().hasInstance() && getReactNativeHost().getUseDeveloperSupport()) {
      if (keyCode == KeyEvent.KEYCODE_MENU) {
        getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
        return true;
      }
      boolean didDoubleTapR = Assertions.assertNotNull(mDoubleTapReloadRecognizer).didDoubleTapR(keyCode, mActivity.getCurrentFocus());
      if (didDoubleTapR) {
        getReactNativeHost().getReactInstanceManager().getDevSupportManager().handleReloadJS();
        return true;
      }
    }
    return false;
  }

  /**
   * Get the {@link ReactNativeHost} used by this app. By default, assumes
   * {@link Activity#getApplication()} is an instance of {@link ReactApplication} and calls
   * {@link ReactApplication#getReactNativeHost()}. Override this method if your application class
   * does not implement {@code ReactApplication} or you simply have a different mechanism for
   * storing a {@code ReactNativeHost}, e.g. as a static field somewhere.
   */
  protected ReactNativeHost getReactNativeHost() {
    return ((ReactApplication) mActivity.getApplication()).getReactNativeHost();
  }

  public ReactInstanceManager getReactInstanceManager() {
    return getReactNativeHost().getReactInstanceManager();
  }

}
