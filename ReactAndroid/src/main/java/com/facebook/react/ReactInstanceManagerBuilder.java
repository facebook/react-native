// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import javax.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

import android.app.Activity;
import android.app.Application;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.cxxbridge.JSBundleLoader;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.RedBoxHandler;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.uimanager.UIImplementationProvider;

/**
 * Builder class for {@link ReactInstanceManager}
 */
public class ReactInstanceManagerBuilder {

  protected final List<ReactPackage> mPackages = new ArrayList<>();

  protected @Nullable String mJSBundleAssetUrl;
  protected @Nullable JSBundleLoader mJSBundleLoader;
  protected @Nullable String mJSMainModuleName;
  protected @Nullable NotThreadSafeBridgeIdleDebugListener mBridgeIdleDebugListener;
  protected @Nullable Application mApplication;
  protected boolean mUseDeveloperSupport;
  protected @Nullable LifecycleState mInitialLifecycleState;
  protected @Nullable UIImplementationProvider mUIImplementationProvider;
  protected @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  protected JSCConfig mJSCConfig = JSCConfig.EMPTY;
  protected @Nullable Activity mCurrentActivity;
  protected @Nullable DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler;
  protected @Nullable RedBoxHandler mRedBoxHandler;
  protected boolean mLazyNativeModulesEnabled;
  protected boolean mLazyViewManagersEnabled;
  protected boolean mUseStartupThread;

  /* package protected */ ReactInstanceManagerBuilder() {
  }

  /**
   * Sets a provider of {@link UIImplementation}.
   * Uses default provider if null is passed.
   */
  public ReactInstanceManagerBuilder setUIImplementationProvider(
    @Nullable UIImplementationProvider uiImplementationProvider) {
    mUIImplementationProvider = uiImplementationProvider;
    return this;
  }

  /**
   * Name of the JS bundle file to be loaded from application's raw assets.
   * Example: {@code "index.android.js"}
   */
  public ReactInstanceManagerBuilder setBundleAssetName(String bundleAssetName) {
    mJSBundleAssetUrl = (bundleAssetName == null ? null : "assets://" + bundleAssetName);
    mJSBundleLoader = null;
    return this;
  }

  /**
   * Path to the JS bundle file to be loaded from the file system.
   *
   * Example: {@code "assets://index.android.js" or "/sdcard/main.jsbundle"}
   */
  public ReactInstanceManagerBuilder setJSBundleFile(String jsBundleFile) {
    if (jsBundleFile.startsWith("assets://")) {
      mJSBundleAssetUrl = jsBundleFile;
      mJSBundleLoader = null;
      return this;
    }
    return setJSBundleLoader(JSBundleLoader.createFileLoader(jsBundleFile));
  }

  /**
   * Bundle loader to use when setting up JS environment. This supersedes
   * prior invcations of {@link setJSBundleFile} and {@link setBundleAssetName}.
   *
   * Example: {@code JSBundleLoader.createFileLoader(application, bundleFile)}
   */
  public ReactInstanceManagerBuilder setJSBundleLoader(JSBundleLoader jsBundleLoader) {
    mJSBundleLoader = jsBundleLoader;
    mJSBundleAssetUrl = null;
    return this;
  }

  /**
   * Path to your app's main module on the packager server. This is used when
   * reloading JS during development. All paths are relative to the root folder
   * the packager is serving files from.
   * Examples:
   * {@code "index.android"} or
   * {@code "subdirectory/index.android"}
   */
  public ReactInstanceManagerBuilder setJSMainModuleName(String jsMainModuleName) {
    mJSMainModuleName = jsMainModuleName;
    return this;
  }

  public ReactInstanceManagerBuilder addPackage(ReactPackage reactPackage) {
    mPackages.add(reactPackage);
    return this;
  }

  public ReactInstanceManagerBuilder setBridgeIdleDebugListener(
    NotThreadSafeBridgeIdleDebugListener bridgeIdleDebugListener) {
    mBridgeIdleDebugListener = bridgeIdleDebugListener;
    return this;
  }

  /**
   * Required. This must be your {@code Application} instance.
   */
  public ReactInstanceManagerBuilder setApplication(Application application) {
    mApplication = application;
    return this;
  }

  public ReactInstanceManagerBuilder setCurrentActivity(Activity activity) {
    mCurrentActivity = activity;
    return this;
  }

  public ReactInstanceManagerBuilder setDefaultHardwareBackBtnHandler(
    DefaultHardwareBackBtnHandler defaultHardwareBackBtnHandler) {
    mDefaultHardwareBackBtnHandler = defaultHardwareBackBtnHandler;
    return this;
  }

  /**
   * When {@code true}, developer options such as JS reloading and debugging are enabled.
   * Note you still have to call {@link #showDevOptionsDialog} to show the dev menu,
   * e.g. when the device Menu button is pressed.
   */
  public ReactInstanceManagerBuilder setUseDeveloperSupport(boolean useDeveloperSupport) {
    mUseDeveloperSupport = useDeveloperSupport;
    return this;
  }

  /**
   * Sets the initial lifecycle state of the host. For example, if the host is already resumed at
   * creation time, we wouldn't expect an onResume call until we get an onPause call.
   */
  public ReactInstanceManagerBuilder setInitialLifecycleState(
    LifecycleState initialLifecycleState) {
    mInitialLifecycleState = initialLifecycleState;
    return this;
  }

  /**
   * Set the exception handler for all native module calls. If not set, the default
   * {@link DevSupportManager} will be used, which shows a redbox in dev mode and rethrows
   * (crashes the app) in prod mode.
   */
  public ReactInstanceManagerBuilder setNativeModuleCallExceptionHandler(
    NativeModuleCallExceptionHandler handler) {
    mNativeModuleCallExceptionHandler = handler;
    return this;
  }

  public ReactInstanceManagerBuilder setJSCConfig(JSCConfig jscConfig) {
    mJSCConfig = jscConfig;
    return this;
  }

  public ReactInstanceManagerBuilder setRedBoxHandler(@Nullable RedBoxHandler redBoxHandler) {
    mRedBoxHandler = redBoxHandler;
    return this;
  }

  public ReactInstanceManagerBuilder setLazyNativeModulesEnabled(boolean lazyNativeModulesEnabled) {
    mLazyNativeModulesEnabled = lazyNativeModulesEnabled;
    return this;
  }

  public ReactInstanceManagerBuilder setLazyViewManagersEnabled(boolean lazyViewManagersEnabled) {
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
    return this;
  }

  public ReactInstanceManagerBuilder setUseStartupThread(boolean useStartupThread) {
    mUseStartupThread = useStartupThread;
    return this;
  }

  /**
   * Instantiates a new {@link ReactInstanceManager}.
   * Before calling {@code build}, the following must be called:
   * <ul>
   * <li> {@link #setApplication}
   * <li> {@link #setCurrentActivity} if the activity has already resumed
   * <li> {@link #setDefaultHardwareBackBtnHandler} if the activity has already resumed
   * <li> {@link #setJSBundleFile} or {@link #setJSMainModuleName}
   * </ul>
   */
  public ReactInstanceManager build() {
    Assertions.assertNotNull(
      mApplication,
      "Application property has not been set with this builder");

    Assertions.assertCondition(
      mUseDeveloperSupport || mJSBundleAssetUrl != null || mJSBundleLoader != null,
      "JS Bundle File or Asset URL has to be provided when dev support is disabled");

    Assertions.assertCondition(
      mJSMainModuleName != null || mJSBundleAssetUrl != null || mJSBundleLoader != null,
      "Either MainModuleName or JS Bundle File needs to be provided");

    if (mUIImplementationProvider == null) {
      // create default UIImplementationProvider if the provided one is null.
      mUIImplementationProvider = new UIImplementationProvider();
    }

    return new ReactInstanceManager(
      mApplication,
      mCurrentActivity,
      mDefaultHardwareBackBtnHandler,
      (mJSBundleLoader == null && mJSBundleAssetUrl != null) ?
        JSBundleLoader.createAssetLoader(mApplication, mJSBundleAssetUrl) : mJSBundleLoader,
      mJSMainModuleName,
      mPackages,
      mUseDeveloperSupport,
      mBridgeIdleDebugListener,
      Assertions.assertNotNull(mInitialLifecycleState, "Initial lifecycle state was not set"),
      mUIImplementationProvider,
      mNativeModuleCallExceptionHandler,
      mJSCConfig,
      mRedBoxHandler,
      mLazyNativeModulesEnabled,
      mLazyViewManagersEnabled,
      mUseStartupThread);
  }
}
