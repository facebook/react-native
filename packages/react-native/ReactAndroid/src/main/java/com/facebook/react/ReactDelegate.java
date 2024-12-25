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
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.devsupport.ReleaseDevSupportManager;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.interfaces.fabric.ReactSurface;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an {@link Activity} or a {@link android.app.Fragment}.
 */
public class ReactDelegate {

  private final Activity mActivity;
  @Nullable private ReactRootView mReactRootView;

  @Nullable private final String mMainComponentName;

  @Nullable private Bundle mLaunchOptions;

  @Nullable private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;

  @Nullable private ReactNativeHost mReactNativeHost;

  @Nullable private ReactHost mReactHost;

  @Nullable private ReactSurface mReactSurface;

  private boolean mFabricEnabled = ReactNativeFeatureFlags.enableFabricRenderer();

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
    mLaunchOptions = launchOptions;
    mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();
    mReactNativeHost = reactNativeHost;
  }

  @Nullable
  private DevSupportManager getDevSupportManager() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()
        && mReactHost != null
        && mReactHost.getDevSupportManager() != null) {
      return mReactHost.getDevSupportManager();
    } else if (getReactNativeHost().hasInstance()
        && getReactNativeHost().getReactInstanceManager() != null) {
      return getReactNativeHost().getReactInstanceManager().getDevSupportManager();
    } else {
      return null;
    }
  }

  public void onHostResume() {
    if (!(mActivity instanceof DefaultHardwareBackBtnHandler)) {
      throw new ClassCastException(
          "Host Activity does not implement DefaultHardwareBackBtnHandler");
    }
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      mReactHost.onHostResume(mActivity, (DefaultHardwareBackBtnHandler) mActivity);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost()
            .getReactInstanceManager()
            .onHostResume(mActivity, (DefaultHardwareBackBtnHandler) mActivity);
      }
    }
  }

  public void onUserLeaveHint() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      mReactHost.onHostLeaveHint(mActivity);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onUserLeaveHint(mActivity);
      }
    }
  }

  public void onHostPause() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      mReactHost.onHostPause(mActivity);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onHostPause(mActivity);
      }
    }
  }

  public void onHostDestroy() {
    unloadApp();
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      mReactHost.onHostDestroy(mActivity);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onHostDestroy(mActivity);
      }
    }
  }

  public boolean onBackPressed() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
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
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
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
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
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
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      mReactHost.onWindowFocusChange(hasFocus);
    } else {
      if (getReactNativeHost().hasInstance()) {
        getReactNativeHost().getReactInstanceManager().onWindowFocusChange(hasFocus);
      }
    }
  }

  public void onConfigurationChanged(Configuration newConfig) {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
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
        && ((ReactNativeFeatureFlags.enableBridgelessArchitecture()
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
      if (ReactNativeFeatureFlags.enableBridgelessArchitecture() && mReactHost != null) {
        DevSupportManager devSupportManager = mReactHost.getDevSupportManager();
        // onKeyLongPress is a Dev API and not supported in RELEASE mode.
        if (devSupportManager != null && !(devSupportManager instanceof ReleaseDevSupportManager)) {
          devSupportManager.showDevOptionsDialog();
          return true;
        }
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
    if (devSupportManager == null) {
      return;
    }

    // Reload in RELEASE mode
    if (devSupportManager instanceof ReleaseDevSupportManager) {
      // Do not reload the bundle from JS as there is no bundler running in release mode.
      if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
        if (mReactHost != null) {
          mReactHost.reload("ReactDelegate.reload()");
        }
      } else {
        UiThreadUtil.runOnUiThread(
            () -> {
              if (mReactNativeHost.hasInstance()
                  && mReactNativeHost.getReactInstanceManager() != null) {
                mReactNativeHost.getReactInstanceManager().recreateReactContextInBackground();
              }
            });
      }
      return;
    }

    // Reload in DEBUG mode
    devSupportManager.handleReloadJS();
  }

  /** Start the React surface with the app key supplied in the {@link ReactDelegate} constructor. */
  public void loadApp() {
    loadApp(mMainComponentName);
  }

  /**
   * Start the React surface for the given app key.
   *
   * @param appKey The ID of the app to load into the surface.
   */
  public void loadApp(String appKey) {
    // With Bridgeless enabled, create and start the surface
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      if (mReactSurface == null) {
        mReactSurface = mReactHost.createSurface(mActivity, appKey, mLaunchOptions);
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

  /** Stop the React surface started with {@link ReactDelegate#loadApp()}. */
  public void unloadApp() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      if (mReactSurface != null) {
        mReactSurface.stop();
        mReactSurface = null;
      }
    } else {
      if (mReactRootView != null) {
        mReactRootView.unmountReactApplication();
        mReactRootView = null;
      }
    }
  }

  @Nullable
  public ReactRootView getReactRootView() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      if (mReactSurface != null) {
        return (ReactRootView) mReactSurface.getView();
      } else {
        return null;
      }
    } else {
      return mReactRootView;
    }
  }

  // Not used in bridgeless
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
    // shouldShowDevMenuOrReload is a Dev API and not supported in RELEASE mode.
    if (devSupportManager == null || devSupportManager instanceof ReleaseDevSupportManager) {
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
  @DeprecatedInNewArchitecture(message = "Use getReactHost()")
  private ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @DeprecatedInNewArchitecture(message = "Use getReactHost()")
  public ReactInstanceManager getReactInstanceManager() {
    return getReactNativeHost().getReactInstanceManager();
  }

  public @Nullable ReactHost getReactHost() {
    return mReactHost;
  }

  /**
   * Get the current {@link ReactContext} from ReactHost or ReactInstanceManager
   *
   * <p>Do not store a reference to this, if the React instance is reloaded or destroyed, this
   * context will no longer be valid.
   */
  public @Nullable ReactContext getCurrentReactContext() {
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      if (mReactHost != null) {
        return mReactHost.getCurrentReactContext();
      } else {
        return null;
      }
    } else {
      return getReactInstanceManager().getCurrentReactContext();
    }
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
}
