package com.facebook.react;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.KeyEvent;
import android.widget.Toast;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

import javax.annotation.Nullable;

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an {@link Activity} or a {@link android.app.Fragment}.
 */
public class ReactDelegate {

  public final int REQUEST_OVERLAY_PERMISSION_CODE = 1111;
  private static final String REDBOX_PERMISSION_MESSAGE =
    "Overlay permissions need to be granted in order for react native apps to run in dev mode.";
  private static final String REDBOX_PERMISSION_GRANTED_MESSAGE =
    "Overlay permissions have been granted.";


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

  public void onHostDetroy() {
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
    } else {
      // Did we request overlay permissions?
      redboxPermissionGranted(requestCode, resultCode, data);
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
   * If the build is a debug build and the OS is greater then or equal to Marshmallow, ask the user
   * for the overlay permission that allows us to show the Redbox overlay.
   *
   * @return True if the permission needs to be granted.
   */
  public boolean askForRedboxPermission() {
    boolean needsOverlayPermission = false;
    if (getReactNativeHost().getUseDeveloperSupport() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show redbox in dev builds.
      if (!Settings.canDrawOverlays(mActivity)) {
        needsOverlayPermission = true;
        Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + mActivity.getPackageName()));
        FLog.w(ReactConstants.TAG, REDBOX_PERMISSION_MESSAGE);
        Toast.makeText(mActivity, REDBOX_PERMISSION_MESSAGE, Toast.LENGTH_LONG).show();
        mActivity.startActivityForResult(serviceIntent, REQUEST_OVERLAY_PERMISSION_CODE);
      }
    }
    return needsOverlayPermission;
  }

  /**
   * Determines if the RedboxPermission was just granted. If it was we can now safely load our
   * React Native application.
   *
   * @param requestCode {@link Activity#onActivityResult(int, int, Intent)}'s requestCode
   * @param resultCode  {@link Activity#onActivityResult(int, int, Intent)}'s resultCode
   * @param data        {@link Activity#onActivityResult(int, int, Intent)}'s intent data
   */
  public void redboxPermissionGranted(int requestCode, int resultCode, Intent data) {
    if (requestCode == REQUEST_OVERLAY_PERMISSION_CODE && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (Settings.canDrawOverlays(mActivity)) {
        loadApp();
        Toast.makeText(mActivity, REDBOX_PERMISSION_GRANTED_MESSAGE, Toast.LENGTH_LONG).show();
      }
    }
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
