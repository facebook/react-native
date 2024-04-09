/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.KeyEvent;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.devsupport.DisabledDevSupportManager;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.interfaces.fabric.ReactSurface;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an {@link Activity} or a {@link android.app.Fragment}.
 */
public class ReactDelegate {

  private final Activity mActivity;
  private ReactRootView mReactRootView;

  @Nullable private final String mMainComponentName;

  @Nullable private Bundle mLaunchOptions;

  @Nullable private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;

  @Nullable private ReactNativeHost mReactNativeHost;

  @Nullable private ReactHost mReactHost;

  @Nullable private ReactSurface mReactSurface;

  private boolean mFabricEnabled = false;

  /**
   * Do not use this constructor as it's not accounting for New Architecture at all. You should
   * either use {@link ReactDelegate#ReactDelegate(Activity, ReactHost, String, Bundle)} if you're
   * on bridgeless mode or {@link ReactDelegate#ReactDelegate(Activity, ReactNativeHost, String,
   * Bundle, boolean)} and use the last parameter to toggle paper/fabric.
   *
   * @deprecated Use one of the other constructors instead to account for New Architecture.
   */
  @Deprecated
  public ReactDelegate(
      Activity activity,
      ReactNativeHost reactNativeHost,
      @Nullable String appKey,
      @Nullable Bundle launchOptions) {
    mActivity = activity;
    mMainComponentName = appKey;
    mLaunchOptions = launchOptions;
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    mReactNativeHost = reactNativeHost;
  }

  public ReactDelegate(
      Activity activity,
      ReactHost reactHost,
      @Nullable String appKey,
      @Nullable Bundle launchOptions) {
    mActivity = activity;
    mMainComponentName = appKey;
    mLaunchOptions = launchOptions;
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    mReactHost = reactHost;
  }

  public ReactDelegate(
      Activity activity,
      ReactNativeHost reactNativeHost,
      @Nullable String appKey,
      @Nullable Bundle launchOptions,
      boolean fabricEnabled) {
    mFabricEnabled = fabricEnabled;
    mActivity = activity;
    mMainComponentName = appKey;
    mLaunchOptions = composeLaunchOptions(launchOptions);
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    mReactNativeHost = reactNativeHost;
  }

  @Nullable
  private DevSupportManager getDevSupportManager() {
    if (ReactFeatureFlags.enableBridgelessArchitecture
        && mReactHost != null
        && mReactHost.getDevSupportManager() != null) {
      return mReactHost.getDevSupportManager();
    } else if (getReactNativeHost().hasInstance()
        && getReactNativeHost().getUseDeveloperSupport()) {
      return getReactNativeHost().getReactInstanceManager().getDevSupportManager();
    } else {
      return null;
    }
  }

  public void onHostResume() {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      if (mActivity instanceof DefaultHardwareBackBtnHandler) {
        mReactHost.onHostResume(mActivity, (DefaultHardwareBackBtnHandler) mActivity);
      }
    } else {
      if (getReactNativeHost().hasInstance()) {
        if (mActivity instanceof DefaultHardwareBackBtnHandler) {
          getReactNativeHost()
              .getReactInstanceManager()
              .onHostResume(mActivity, (DefaultHardwareBackBtnHandler) mActivity);
        } else {
          throw new ClassCastException(
              "Host Activity does not implement DefaultHardwareBackBtnHandler");
        }
      }
    }
  }

  public void onHostPause() {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onHostPause(mActivity);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onHostPause(mActivity);
      }
    }
  }

  public void onHostDestroy() {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onHostDestroy(mActivity);
    } else {
      if (mReactRootView != null) {
        mReactRootView.unmountReactApplication();
        mReactRootView = null;
      }
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onHostDestroy(mActivity);
      }
    }
  }

  public boolean onBackPressed() {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onBackPressed();
      return true;
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onBackPressed();
        return true;
      }
    }
    return false;
  }

  public boolean onNewIntent(Intent intent) {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onNewIntent(intent);
      return true;
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onNewIntent(intent);
        return true;
      }
    }
    return false;
  }

  public void onActivityResult(
      int requestCode, int resultCode, Intent data, boolean shouldForwardToReactInstance) {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onActivityResult(mActivity, requestCode, resultCode, data);
    } else {
      if (getReactNativeHost().hasInstance() && shouldForwardToReactInstance) {
        getReactNativeHost()
            .getReactInstanceManager()
            .onActivityResult(mActivity, requestCode, resultCode, data);
      }
    }
  }

  public void onWindowFocusChanged(boolean hasFocus) {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onWindowFocusChange(hasFocus);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onWindowFocusChange(hasFocus);
      }
    }
  }

  public void onConfigurationChanged(Configuration newConfig) {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      mReactHost.onConfigurationChanged(Assertions.assertNotNull(mActivity));
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactInstanceManager()
            .onConfigurationChanged(Assertions.assertNotNull(mActivity), newConfig);
      }
    }
  }

  public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD
        && ((ReactFeatureFlags.enableBridgelessArchitecture
                && mReactHost != null
                && mReactHost.getDevSupportManager() != null)
            || (getReactNativeHost().hasInstance()
                && getReactNativeHost().getUseDeveloperSupport()))) {
      event.startTracking();
      return true;
    }
    return false;
  }

  public boolean onKeyLongPress(int keyCode) {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
      if (ReactFeatureFlags.enableBridgelessArchitecture
          && mReactHost != null
          && mReactHost.getDevSupportManager() != null) {
        mReactHost.getDevSupportManager().showDevOptionsDialog();
        return true;
      } else {
        if (getReactNativeHost().hasInstance() && getReactNativeHost().getUseDeveloperSupport()) {
          getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
          return true;
        }
      }
    }
    return false;
  }

  public void reload() {
    DevSupportManager devSupportManager = getDevSupportManager();
    if (devSupportManager != null) {
      // With Bridgeless enabled, reload in RELEASE mode
      if (devSupportManager instanceof DisabledDevSupportManager
          && ReactFeatureFlags.enableBridgelessArchitecture
          && mReactHost != null) {
        // Do not reload the bundle from JS as there is no bundler running in release mode.
        mReactHost.reload("ReactDelegate.reload()");
      } else {
        devSupportManager.handleReloadJS();
      }
    }
  }

  public void loadApp() {
    loadApp(mMainComponentName);
  }

  public void loadApp(String appKey) {
    // With Bridgeless enabled, create and start the surface
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      if (mReactSurface == null) {
        // Create a ReactSurface
        mReactSurface = mReactHost.createSurface(mActivity, appKey, mLaunchOptions);
        // Set main Activity's content view
        mActivity.setContentView(mReactSurface.getView());
      }
      mReactSurface.start();
    } else {
      if (mReactRootView != null) {
        throw new IllegalStateException("Cannot loadApp while app is already running.");
      }
      mReactRootView = createRootView();
      mReactRootView.startReactApplication(
          getReactNativeHost().getReactInstanceManager(), appKey, mLaunchOptions);
    }
  }

  public ReactRootView getReactRootView() {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      return (ReactRootView) mReactSurface.getView();
    } else {
      return mReactRootView;
    }
  }

  protected ReactRootView createRootView() {
    ReactRootView reactRootView = new ReactRootView(mActivity);
    reactRootView.setIsFabric(isFabricEnabled());
    return reactRootView;
  }

  /**
   * Handles delegating the {@link Activity#onKeyUp(int, KeyEvent)} method to determine whether the
   * application should show the developer menu or should reload the React Application.
   *
   * @return true if we consume the event and either shoed the develop menu or reloaded the
   *     application.
   */
  public boolean shouldShowDevMenuOrReload(int keyCode, KeyEvent event) {
    DevSupportManager devSupportManager = getDevSupportManager();
    if (devSupportManager == null) {
      return false;
    }

    if (keyCode == KeyEvent.KEYCODE_MENU) {
      devSupportManager.showDevOptionsDialog();
      return true;
    }
    boolean didDoubleTapR =
        Assertions.assertNotNull(mDoubleTapReloadRecognizer)
            .didDoubleTapR(keyCode, mActivity.getCurrentFocus());
    if (didDoubleTapR) {
      devSupportManager.handleReloadJS();
      return true;
    }
    return false;
  }

  /** Get the {@link ReactNativeHost} used by this app. */
  private ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  public ReactInstanceManager getReactInstanceManager() {
    return getReactNativeHost().getReactInstanceManager();
  }

  /**
   * Override this method if you wish to selectively toggle Fabric for a specific surface. This will
   * also control if Concurrent Root (React 18) should be enabled or not.
   *
   * @return true if Fabric is enabled for this Activity, false otherwise.
   */
  protected boolean isFabricEnabled() {
    return mFabricEnabled;
  }

  private @NonNull Bundle composeLaunchOptions(Bundle composedLaunchOptions) {
    if (isFabricEnabled()) {
      if (composedLaunchOptions == null) {
        composedLaunchOptions = new Bundle();
      }
    }
    return composedLaunchOptions;
  }
}
