/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static com.facebook.react.ReactInstanceManager.initializeSoLoaderIfNecessary;
import static com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getFriendlyDeviceName;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.hermes.reactexecutor.HermesExecutor;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.devsupport.DefaultDevSupportManagerFactory;
import com.facebook.react.devsupport.DevSupportManagerFactory;
import com.facebook.react.devsupport.RedBoxHandler;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.jscexecutor.JSCExecutor;
import com.facebook.react.jscexecutor.JSCExecutorFactory;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.packagerconnection.RequestHandler;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.soloader.SoLoader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Builder class for {@link ReactInstanceManager} */
public class ReactInstanceManagerBuilder {

  private final List<ReactPackage> mPackages = new ArrayList<>();

  private @Nullable String mJSBundleAssetUrl;
  private @Nullable JSBundleLoader mJSBundleLoader;
  private @Nullable String mJSMainModulePath;
  private @Nullable NotThreadSafeBridgeIdleDebugListener mBridgeIdleDebugListener;
  private @Nullable Application mApplication;
  private boolean mUseDeveloperSupport;
  private @Nullable DevSupportManagerFactory mDevSupportManagerFactory;
  private boolean mRequireActivity;
  private @Nullable LifecycleState mInitialLifecycleState;
  private @Nullable UIImplementationProvider mUIImplementationProvider;
  private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  private @Nullable Activity mCurrentActivity;
  private @Nullable DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler;
  private @Nullable RedBoxHandler mRedBoxHandler;
  private boolean mLazyViewManagersEnabled;
  private @Nullable DevBundleDownloadListener mDevBundleDownloadListener;
  private @Nullable JavaScriptExecutorFactory mJavaScriptExecutorFactory;
  private int mMinNumShakes = 1;
  private int mMinTimeLeftInFrameForNonBatchedOperationMs = -1;
  private @Nullable JSIModulePackage mJSIModulesPackage;
  private @Nullable Map<String, RequestHandler> mCustomPackagerCommandHandlers;
  private @Nullable ReactPackageTurboModuleManagerDelegate.Builder mTMMDelegateBuilder;
  private @Nullable SurfaceDelegateFactory mSurfaceDelegateFactory;

  /* package protected */ ReactInstanceManagerBuilder() {}

  /** Sets a provider of {@link UIImplementation}. Uses default provider if null is passed. */
  public ReactInstanceManagerBuilder setUIImplementationProvider(
      @Nullable UIImplementationProvider uiImplementationProvider) {
    mUIImplementationProvider = uiImplementationProvider;
    return this;
  }

  public ReactInstanceManagerBuilder setJSIModulesPackage(
      @Nullable JSIModulePackage jsiModulePackage) {
    mJSIModulesPackage = jsiModulePackage;
    return this;
  }

  /** Factory for desired implementation of JavaScriptExecutor. */
  public ReactInstanceManagerBuilder setJavaScriptExecutorFactory(
      @Nullable JavaScriptExecutorFactory javaScriptExecutorFactory) {
    mJavaScriptExecutorFactory = javaScriptExecutorFactory;
    return this;
  }

  /**
   * Name of the JS bundle file to be loaded from application's raw assets. Example: {@code
   * "index.android.js"}
   */
  public ReactInstanceManagerBuilder setBundleAssetName(String bundleAssetName) {
    mJSBundleAssetUrl = (bundleAssetName == null ? null : "assets://" + bundleAssetName);
    mJSBundleLoader = null;
    return this;
  }

  /**
   * Path to the JS bundle file to be loaded from the file system.
   *
   * <p>Example: {@code "assets://index.android.js" or "/sdcard/main.jsbundle"}
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
   * Bundle loader to use when setting up JS environment. This supersedes prior invocations of
   * {@link setJSBundleFile} and {@link setBundleAssetName}.
   *
   * <p>Example: {@code JSBundleLoader.createFileLoader(application, bundleFile)}
   */
  public ReactInstanceManagerBuilder setJSBundleLoader(JSBundleLoader jsBundleLoader) {
    mJSBundleLoader = jsBundleLoader;
    mJSBundleAssetUrl = null;
    return this;
  }

  /**
   * Path to your app's main module on Metro. This is used when reloading JS during development. All
   * paths are relative to the root folder the packager is serving files from. Examples: {@code
   * "index.android"} or {@code "subdirectory/index.android"}
   */
  public ReactInstanceManagerBuilder setJSMainModulePath(String jsMainModulePath) {
    mJSMainModulePath = jsMainModulePath;
    return this;
  }

  public ReactInstanceManagerBuilder addPackage(ReactPackage reactPackage) {
    mPackages.add(reactPackage);
    return this;
  }

  public ReactInstanceManagerBuilder addPackages(List<ReactPackage> reactPackages) {
    mPackages.addAll(reactPackages);
    return this;
  }

  public ReactInstanceManagerBuilder setBridgeIdleDebugListener(
      NotThreadSafeBridgeIdleDebugListener bridgeIdleDebugListener) {
    mBridgeIdleDebugListener = bridgeIdleDebugListener;
    return this;
  }

  /** Required. This must be your {@code Application} instance. */
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
   * When {@code true}, developer options such as JS reloading and debugging are enabled. Note you
   * still have to call {@link #showDevOptionsDialog} to show the dev menu, e.g. when the device
   * Menu button is pressed.
   */
  public ReactInstanceManagerBuilder setUseDeveloperSupport(boolean useDeveloperSupport) {
    mUseDeveloperSupport = useDeveloperSupport;
    return this;
  }

  /**
   * Set the custom {@link DevSupportManagerFactory}. If not set, will use {@link
   * DefaultDevSupportManagerFactory}.
   */
  public ReactInstanceManagerBuilder setDevSupportManagerFactory(
      final DevSupportManagerFactory devSupportManagerFactory) {
    mDevSupportManagerFactory = devSupportManagerFactory;
    return this;
  }

  /**
   * When {@code false}, indicates that correct usage of React Native will NOT involve an Activity.
   * For the vast majority of Android apps in the ecosystem, this will not need to change. Unless
   * you really know what you're doing, you should probably not change this!
   */
  public ReactInstanceManagerBuilder setRequireActivity(boolean requireActivity) {
    mRequireActivity = requireActivity;
    return this;
  }

  /**
   * When the {@link SurfaceDelegateFactory} is provided, it will be used for native modules to get
   * a {@link SurfaceDelegate} to interact with the platform specific surface that they that needs
   * to be rendered in. For mobile platform this is default to be null so that these modules will
   * need to provide a default surface delegate. One example of such native module is LogBoxModule,
   * which is rendered in mobile platform with LogBoxDialog, while in VR platform with custom layer
   * provided by runtime.
   */
  public ReactInstanceManagerBuilder setSurfaceDelegateFactory(
      @Nullable final SurfaceDelegateFactory surfaceDelegateFactory) {
    mSurfaceDelegateFactory = surfaceDelegateFactory;
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
   * Set the exception handler for all native module calls. If not set, the default {@link
   * DevSupportManager} will be used, which shows a redbox in dev mode and rethrows (crashes the
   * app) in prod mode.
   */
  public ReactInstanceManagerBuilder setNativeModuleCallExceptionHandler(
      NativeModuleCallExceptionHandler handler) {
    mNativeModuleCallExceptionHandler = handler;
    return this;
  }

  public ReactInstanceManagerBuilder setRedBoxHandler(@Nullable RedBoxHandler redBoxHandler) {
    mRedBoxHandler = redBoxHandler;
    return this;
  }

  public ReactInstanceManagerBuilder setLazyViewManagersEnabled(boolean lazyViewManagersEnabled) {
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
    return this;
  }

  public ReactInstanceManagerBuilder setDevBundleDownloadListener(
      @Nullable DevBundleDownloadListener listener) {
    mDevBundleDownloadListener = listener;
    return this;
  }

  public ReactInstanceManagerBuilder setMinNumShakes(int minNumShakes) {
    mMinNumShakes = minNumShakes;
    return this;
  }

  public ReactInstanceManagerBuilder setMinTimeLeftInFrameForNonBatchedOperationMs(
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    mMinTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs;
    return this;
  }

  public ReactInstanceManagerBuilder setCustomPackagerCommandHandlers(
      Map<String, RequestHandler> customPackagerCommandHandlers) {
    mCustomPackagerCommandHandlers = customPackagerCommandHandlers;
    return this;
  }

  public ReactInstanceManagerBuilder setReactPackageTurboModuleManagerDelegateBuilder(
      @Nullable ReactPackageTurboModuleManagerDelegate.Builder builder) {
    mTMMDelegateBuilder = builder;
    return this;
  }

  /**
   * Instantiates a new {@link ReactInstanceManager}. Before calling {@code build}, the following
   * must be called:
   *
   * <ul>
   *   <li>{@link #setApplication}
   *   <li>{@link #setCurrentActivity} if the activity has already resumed
   *   <li>{@link #setDefaultHardwareBackBtnHandler} if the activity has already resumed
   *   <li>{@link #setJSBundleFile} or {@link #setJSMainModulePath}
   * </ul>
   */
  public ReactInstanceManager build() {
    Assertions.assertNotNull(
        mApplication, "Application property has not been set with this builder");

    if (mInitialLifecycleState == LifecycleState.RESUMED) {
      Assertions.assertNotNull(
          mCurrentActivity, "Activity needs to be set if initial lifecycle state is resumed");
    }

    Assertions.assertCondition(
        mUseDeveloperSupport || mJSBundleAssetUrl != null || mJSBundleLoader != null,
        "JS Bundle File or Asset URL has to be provided when dev support is disabled");

    Assertions.assertCondition(
        mJSMainModulePath != null || mJSBundleAssetUrl != null || mJSBundleLoader != null,
        "Either MainModulePath or JS Bundle File needs to be provided");

    if (mUIImplementationProvider == null) {
      // create default UIImplementationProvider if the provided one is null.
      mUIImplementationProvider = new UIImplementationProvider();
    }

    // We use the name of the device and the app for debugging & metrics
    //noinspection ConstantConditions
    String appName = mApplication.getPackageName();
    String deviceName = getFriendlyDeviceName();

    return new ReactInstanceManager(
        mApplication,
        mCurrentActivity,
        mDefaultHardwareBackBtnHandler,
        mJavaScriptExecutorFactory == null
            ? getDefaultJSExecutorFactory(appName, deviceName, mApplication.getApplicationContext())
            : mJavaScriptExecutorFactory,
        (mJSBundleLoader == null && mJSBundleAssetUrl != null)
            ? JSBundleLoader.createAssetLoader(
                mApplication, mJSBundleAssetUrl, false /*Asynchronous*/)
            : mJSBundleLoader,
        mJSMainModulePath,
        mPackages,
        mUseDeveloperSupport,
        mDevSupportManagerFactory == null
            ? new DefaultDevSupportManagerFactory()
            : mDevSupportManagerFactory,
        mRequireActivity,
        mBridgeIdleDebugListener,
        Assertions.assertNotNull(mInitialLifecycleState, "Initial lifecycle state was not set"),
        mUIImplementationProvider,
        mNativeModuleCallExceptionHandler,
        mRedBoxHandler,
        mLazyViewManagersEnabled,
        mDevBundleDownloadListener,
        mMinNumShakes,
        mMinTimeLeftInFrameForNonBatchedOperationMs,
        mJSIModulesPackage,
        mCustomPackagerCommandHandlers,
        mTMMDelegateBuilder,
        mSurfaceDelegateFactory);
  }

  private JavaScriptExecutorFactory getDefaultJSExecutorFactory(
      String appName, String deviceName, Context applicationContext) {
    try {
      // If JSC is included, use it as normal
      initializeSoLoaderIfNecessary(applicationContext);
      JSCExecutor.loadLibrary();
      return new JSCExecutorFactory(appName, deviceName);
    } catch (UnsatisfiedLinkError jscE) {
      // https://github.com/facebook/hermes/issues/78 shows that
      // people who aren't trying to use Hermes are having issues.
      // https://github.com/facebook/react-native/issues/25923#issuecomment-554295179
      // includes the actual JSC error in at least one case.
      //
      // So, if "__cxa_bad_typeid" shows up in the jscE exception
      // message, then we will assume that's the failure and just
      // throw now.

      if (jscE.getMessage().contains("__cxa_bad_typeid")) {
        throw jscE;
      }

      // Otherwise use Hermes
      try {
        HermesExecutor.loadLibrary();
        return new HermesExecutorFactory();
      } catch (UnsatisfiedLinkError hermesE) {
        // If we get here, either this is a JSC build, and of course
        // Hermes failed (since it's not in the APK), or it's a Hermes
        // build, and Hermes had a problem.

        // We suspect this is a JSC issue (it's the default), so we
        // will throw that exception, but we will print hermesE first,
        // since it could be a Hermes issue and we don't want to
        // swallow that.
        hermesE.printStackTrace();
        throw jscE;
      }
    }
  }
}
