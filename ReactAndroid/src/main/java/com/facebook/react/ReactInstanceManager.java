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

import java.util.ArrayList;
import java.util.List;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.view.View;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSCJavaScriptExecutor;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.JavaScriptModulesConfig;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.NativeModuleRegistry;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.ProxyJavaScriptExecutor;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.queue.CatalystQueueConfigurationSpec;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.devsupport.DevServerHelper;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.devsupport.ReactInstanceDevCommandsHandler;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.AppRegistry;
import com.facebook.react.uimanager.ReactNative;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.soloader.SoLoader;

/**
 * This class is managing instances of {@link CatalystInstance}. It expose a way to configure
 * catalyst instance using {@link ReactPackage} and keeps track of the lifecycle of that
 * instance. It also sets up connection between the instance and developers support functionality
 * of the framework.
 *
 * An instance of this manager is required to start JS application in {@link ReactRootView} (see
 * {@link ReactRootView#startReactApplication} for more info).
 *
 * The lifecycle of the instance of {@link ReactInstanceManager} should be bound to the activity
 * that owns the {@link ReactRootView} that is used to render react application using this
 * instance manager (see {@link ReactRootView#startReactApplication}). It's required to pass
 * owning activity's lifecycle events to the instance manager (see {@link #onPause},
 * {@link #onDestroy} and {@link #onResume}).
 *
 * To instantiate an instance of this class use {@link #builder}.
 */
public class ReactInstanceManager {

  /* should only be accessed from main thread (UI thread) */
  private final List<ReactRootView> mAttachedRootViews = new ArrayList<>();
  private LifecycleState mLifecycleState;
  private boolean mIsContextInitAsyncTaskRunning;
  private @Nullable ReactContextInitParams mPendingReactContextInitParams;

  /* accessed from any thread */
  private @Nullable String mJSBundleFile; /* path to JS bundle on file system */
  private final @Nullable String mJSMainModuleName; /* path to JS bundle root on packager server */
  private final List<ReactPackage> mPackages;
  private final DevSupportManager mDevSupportManager;
  private final boolean mUseDeveloperSupport;
  private final @Nullable NotThreadSafeBridgeIdleDebugListener mBridgeIdleDebugListener;
  private @Nullable volatile ReactContext mCurrentReactContext;
  private final Context mApplicationContext;
  private @Nullable DefaultHardwareBackBtnHandler mDefaultBackButtonImpl;
  private String mSourceUrl;
  private @Nullable Activity mCurrentActivity;

  private final ReactInstanceDevCommandsHandler mDevInterface =
      new ReactInstanceDevCommandsHandler() {

        @Override
        public void onReloadWithJSDebugger(ProxyJavaScriptExecutor proxyExecutor) {
          ReactInstanceManager.this.onReloadWithJSDebugger(proxyExecutor);
        }

        @Override
        public void onJSBundleLoadedFromServer() {
          ReactInstanceManager.this.onJSBundleLoadedFromServer();
        }

        @Override
        public void toggleElementInspector() {
          ReactInstanceManager.this.toggleElementInspector();
        }
      };

  private final DefaultHardwareBackBtnHandler mBackBtnHandler =
      new DefaultHardwareBackBtnHandler() {
        @Override
        public void invokeDefaultOnBackPressed() {
          ReactInstanceManager.this.invokeDefaultOnBackPressed();
        }
      };

  private class ReactContextInitParams {
    private final JavaScriptExecutor mJsExecutor;
    private final JSBundleLoader mJsBundleLoader;

    public ReactContextInitParams(
        JavaScriptExecutor jsExecutor,
        JSBundleLoader jsBundleLoader) {
      mJsExecutor = Assertions.assertNotNull(jsExecutor);
      mJsBundleLoader = Assertions.assertNotNull(jsBundleLoader);
    }

    public JavaScriptExecutor getJsExecutor() {
      return mJsExecutor;
    }

    public JSBundleLoader getJsBundleLoader() {
      return mJsBundleLoader;
    }
  }

  /*
   * Task class responsible for (re)creating react context in the background. These tasks can only
   * be executing one at time, see {@link #recreateReactContextInBackground()}.
   */
  private final class ReactContextInitAsyncTask extends
      AsyncTask<ReactContextInitParams, Void, ReactApplicationContext> {

    @Override
    protected void onPreExecute() {
      if (mCurrentReactContext != null) {
        tearDownReactContext(mCurrentReactContext);
        mCurrentReactContext = null;
      }
    }

    @Override
    protected ReactApplicationContext doInBackground(ReactContextInitParams... params) {
      Assertions.assertCondition(params != null && params.length > 0 && params[0] != null);
      return createReactContext(params[0].getJsExecutor(), params[0].getJsBundleLoader());
    }

    @Override
    protected void onPostExecute(ReactApplicationContext reactContext) {
      try {
        setupReactContext(reactContext);
      } finally {
        mIsContextInitAsyncTaskRunning = false;
      }

      // Handle enqueued request to re-initialize react context.
      if (mPendingReactContextInitParams != null) {
        recreateReactContextInBackground(
            mPendingReactContextInitParams.getJsExecutor(),
            mPendingReactContextInitParams.getJsBundleLoader());
        mPendingReactContextInitParams = null;
      }
    }
  }

  private ReactInstanceManager(
      Context applicationContext,
      @Nullable String jsBundleFile,
      @Nullable String jsMainModuleName,
      List<ReactPackage> packages,
      boolean useDeveloperSupport,
      @Nullable NotThreadSafeBridgeIdleDebugListener bridgeIdleDebugListener,
      LifecycleState initialLifecycleState) {
    initializeSoLoaderIfNecessary(applicationContext);

    mApplicationContext = applicationContext;
    mJSBundleFile = jsBundleFile;
    mJSMainModuleName = jsMainModuleName;
    mPackages = packages;
    mUseDeveloperSupport = useDeveloperSupport;
    // We need to instantiate DevSupportManager regardless to the useDeveloperSupport option,
    // although will prevent dev support manager from displaying any options or dialogs by
    // checking useDeveloperSupport option before calling setDevSupportEnabled on this manager
    // TODO(6803830): Don't instantiate devsupport manager when useDeveloperSupport is false
    mDevSupportManager = new DevSupportManager(
        applicationContext,
        mDevInterface,
        mJSMainModuleName,
        useDeveloperSupport);
    mBridgeIdleDebugListener = bridgeIdleDebugListener;
    mLifecycleState = initialLifecycleState;
  }

  public DevSupportManager getDevSupportManager() {
    return mDevSupportManager;
  }

  /**
   * Creates a builder that is capable of creating an instance of {@link ReactInstanceManager}.
   */
  public static Builder builder() {
    return new Builder();
  }

  private static void initializeSoLoaderIfNecessary(Context applicationContext) {
    // Call SoLoader.initialize here, this is required for apps that does not use exopackage and
    // does not use SoLoader for loading other native code except from the one used by React Native
    // This way we don't need to require others to have additional initialization code and to
    // subclass android.app.Application.

    // Method SoLoader.init is idempotent, so if you wish to use native exopackage, just call
    // SoLoader.init with appropriate args before initializing ReactInstanceManager
    SoLoader.init(applicationContext, /* native exopackage */ false);
  }

  public void setJSBundleFile(String jsBundleFile) {
    mJSBundleFile = jsBundleFile;
  }

  /**
   * Trigger react context initialization asynchronously in a background async task. This enables
   * applications to pre-load the application JS, and execute global code before
   * {@link ReactRootView} is available and measured.
   *
   * Called from UI thread.
   */
  public void createReactContextInBackground() {
    if (mUseDeveloperSupport && mJSMainModuleName != null) {
      if (mDevSupportManager.hasUpToDateJSBundleInCache()) {
        // If there is a up-to-date bundle downloaded from server, always use that
        onJSBundleLoadedFromServer();
      } else if (mJSBundleFile == null) {
        mDevSupportManager.handleReloadJS();
      } else {
        mDevSupportManager.isPackagerRunning(
            new DevServerHelper.PackagerStatusCallback() {
              @Override
              public void onPackagerStatusFetched(final boolean packagerIsRunning) {
                UiThreadUtil.runOnUiThread(
                    new Runnable() {
                      @Override
                      public void run() {
                        if (packagerIsRunning) {
                          mDevSupportManager.handleReloadJS();
                        } else {
                          recreateReactContextInBackgroundFromBundleFile();
                        }
                      }
                    });
              }
            });
      }
      return;
    }

    recreateReactContextInBackgroundFromBundleFile();
  }

  private void recreateReactContextInBackgroundFromBundleFile() {
    recreateReactContextInBackground(
        new JSCJavaScriptExecutor(),
        JSBundleLoader.createFileLoader(mApplicationContext, mJSBundleFile));
  }

  /**
   * This method will give JS the opportunity to consume the back button event. If JS does not
   * consume the event, mDefaultBackButtonImpl will be invoked at the end of the round trip to JS.
   */
  public void onBackPressed() {
    UiThreadUtil.assertOnUiThread();
    ReactContext reactContext = mCurrentReactContext;
    if (mCurrentReactContext == null) {
      // Invoke without round trip to JS.
      FLog.w(ReactConstants.TAG, "Instance detached from instance manager");
      invokeDefaultOnBackPressed();
    } else {
      DeviceEventManagerModule deviceEventManagerModule =
          Assertions.assertNotNull(reactContext).getNativeModule(DeviceEventManagerModule.class);
      deviceEventManagerModule.emitHardwareBackPressed();
    }
  }

  private void invokeDefaultOnBackPressed() {
    UiThreadUtil.assertOnUiThread();
    if (mDefaultBackButtonImpl != null) {
      mDefaultBackButtonImpl.invokeDefaultOnBackPressed();
    }
  }

  private void toggleElementInspector() {
    if (mCurrentReactContext != null) {
      mCurrentReactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("toggleElementInspector", null);
    }
  }

  public void onPause() {
    UiThreadUtil.assertOnUiThread();

    mLifecycleState = LifecycleState.BEFORE_RESUME;

    mDefaultBackButtonImpl = null;
    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    mCurrentActivity = null;
    if (mCurrentReactContext != null) {
      mCurrentReactContext.onPause();
    }
  }

  /**
   * Use this method when the activity resumes to enable invoking the back button directly from JS.
   *
   * This method retains an instance to provided mDefaultBackButtonImpl. Thus it's
   * important to pass from the activity instance that owns this particular instance of {@link
   * ReactInstanceManager}, so that once this instance receive {@link #onDestroy} event it will
   * clear the reference to that defaultBackButtonImpl.
   *
   * @param defaultBackButtonImpl a {@link DefaultHardwareBackBtnHandler} from an Activity that owns
   * this instance of {@link ReactInstanceManager}.
   */
  public void onResume(Activity activity, DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
    UiThreadUtil.assertOnUiThread();

    mLifecycleState = LifecycleState.RESUMED;

    mDefaultBackButtonImpl = defaultBackButtonImpl;
    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(true);
    }

    mCurrentActivity = activity;
    if (mCurrentReactContext != null) {
      mCurrentReactContext.onResume(activity);
    }
  }

  public void onDestroy() {
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    if (mCurrentReactContext != null) {
      mCurrentReactContext.onDestroy();
    }
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (mCurrentReactContext != null) {
      mCurrentReactContext.onActivityResult(requestCode, resultCode, data);
    }
  }

  public void showDevOptionsDialog() {
    UiThreadUtil.assertOnUiThread();
    mDevSupportManager.showDevOptionsDialog();
  }

  /**
   * Get the URL where the last bundle was loaded from.
   */
  public String getSourceUrl() {
    return Assertions.assertNotNull(mSourceUrl);
  }

  /**
   * Attach given {@param rootView} to a catalyst instance manager and start JS application using
   * JS module provided by {@link ReactRootView#getJSModuleName}. If the react context is currently
   * being (re)-created, or if react context has not been created yet, the JS application associated
   * with the provided root view will be started asynchronously, i.e this method won't block.
   * This view will then be tracked by this manager and in case of catalyst instance restart it will
   * be re-attached.
   */
  /* package */ void attachMeasuredRootView(ReactRootView rootView) {
    UiThreadUtil.assertOnUiThread();
    mAttachedRootViews.add(rootView);

    // If react context is being created in the background, JS application will be started
    // automatically when creation completes, as root view is part of the attached root view list.
    if (!mIsContextInitAsyncTaskRunning) {
      if (mCurrentReactContext == null) {
        createReactContextInBackground();
      } else {
        attachMeasuredRootViewToInstance(rootView, mCurrentReactContext.getCatalystInstance());
      }
    }
  }

  /**
   * Detach given {@param rootView} from current catalyst instance. It's safe to call this method
   * multiple times on the same {@param rootView} - in that case view will be detached with the
   * first call.
   */
  /* package */ void detachRootView(ReactRootView rootView) {
    UiThreadUtil.assertOnUiThread();
    if (mAttachedRootViews.remove(rootView)) {
      if (mCurrentReactContext != null && mCurrentReactContext.hasActiveCatalystInstance()) {
        detachViewFromInstance(rootView, mCurrentReactContext.getCatalystInstance());
      }
    }
  }

  /**
   * Uses configured {@link ReactPackage} instances to create all view managers
   */
  /* package */ List<ViewManager> createAllViewManagers(
      ReactApplicationContext catalystApplicationContext) {
    List<ViewManager> allViewManagers = new ArrayList<>();
    for (ReactPackage reactPackage : mPackages) {
      allViewManagers.addAll(reactPackage.createViewManagers(catalystApplicationContext));
    }
    return allViewManagers;
  }

  @VisibleForTesting
  public @Nullable ReactContext getCurrentReactContext() {
    return mCurrentReactContext;
  }

  private void onReloadWithJSDebugger(ProxyJavaScriptExecutor proxyExecutor) {
    recreateReactContextInBackground(
        proxyExecutor,
        JSBundleLoader.createRemoteDebuggerBundleLoader(
            mDevSupportManager.getJSBundleURLForRemoteDebugging()));
  }

  private void onJSBundleLoadedFromServer() {
    recreateReactContextInBackground(
        new JSCJavaScriptExecutor(),
        JSBundleLoader.createCachedBundleFromNetworkLoader(
            mDevSupportManager.getSourceUrl(),
            mDevSupportManager.getDownloadedJSBundleFile()));
  }

  private void recreateReactContextInBackground(
      JavaScriptExecutor jsExecutor,
      JSBundleLoader jsBundleLoader) {
    UiThreadUtil.assertOnUiThread();

    ReactContextInitParams initParams = new ReactContextInitParams(jsExecutor, jsBundleLoader);
    if (!mIsContextInitAsyncTaskRunning) {
      // No background task to create react context is currently running, create and execute one.
      ReactContextInitAsyncTask initTask = new ReactContextInitAsyncTask();
      initTask.execute(initParams);
      mIsContextInitAsyncTaskRunning = true;
    } else {
      // Background task is currently running, queue up most recent init params to recreate context
      // once task completes.
      mPendingReactContextInitParams = initParams;
    }
  }

  private void setupReactContext(ReactApplicationContext reactContext) {
    UiThreadUtil.assertOnUiThread();
    Assertions.assertCondition(mCurrentReactContext == null);
    mCurrentReactContext = Assertions.assertNotNull(reactContext);
    CatalystInstance catalystInstance =
        Assertions.assertNotNull(reactContext.getCatalystInstance());

    catalystInstance.initialize();
    mDevSupportManager.onNewReactContextCreated(reactContext);
    moveReactContextToCurrentLifecycleState(reactContext);

    for (ReactRootView rootView : mAttachedRootViews) {
      attachMeasuredRootViewToInstance(rootView, catalystInstance);
    }
  }

  private void attachMeasuredRootViewToInstance(
      ReactRootView rootView,
      CatalystInstance catalystInstance) {
    UiThreadUtil.assertOnUiThread();

    // Reset view content as it's going to be populated by the application content from JS
    rootView.removeAllViews();
    rootView.setId(View.NO_ID);

    UIManagerModule uiManagerModule = catalystInstance.getNativeModule(UIManagerModule.class);
    int rootTag = uiManagerModule.addMeasuredRootView(rootView);
    @Nullable Bundle launchOptions = rootView.getLaunchOptions();
    WritableMap initialProps = launchOptions != null
        ? Arguments.fromBundle(launchOptions)
        : Arguments.createMap();
    String jsAppModuleName = rootView.getJSModuleName();

    WritableNativeMap appParams = new WritableNativeMap();
    appParams.putDouble("rootTag", rootTag);
    appParams.putMap("initialProps", initialProps);
    catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
  }

  private void detachViewFromInstance(
      ReactRootView rootView,
      CatalystInstance catalystInstance) {
    UiThreadUtil.assertOnUiThread();
    catalystInstance.getJSModule(ReactNative.class)
        .unmountComponentAtNodeAndRemoveContainer(rootView.getId());
  }

  private void tearDownReactContext(ReactContext reactContext) {
    UiThreadUtil.assertOnUiThread();
    if (mLifecycleState == LifecycleState.RESUMED) {
      reactContext.onPause();
    }
    for (ReactRootView rootView : mAttachedRootViews) {
      detachViewFromInstance(rootView, reactContext.getCatalystInstance());
    }
    reactContext.onDestroy();
    mDevSupportManager.onReactInstanceDestroyed(reactContext);
  }

  /**
   * @return instance of {@link ReactContext} configured a {@link CatalystInstance} set
   */
  private ReactApplicationContext createReactContext(
      JavaScriptExecutor jsExecutor,
      JSBundleLoader jsBundleLoader) {
    FLog.i(ReactConstants.TAG, "Creating react context.");
    mSourceUrl = jsBundleLoader.getSourceUrl();
    NativeModuleRegistry.Builder nativeRegistryBuilder = new NativeModuleRegistry.Builder();
    JavaScriptModulesConfig.Builder jsModulesBuilder = new JavaScriptModulesConfig.Builder();

    ReactApplicationContext reactContext = new ReactApplicationContext(mApplicationContext);
    if (mUseDeveloperSupport) {
      reactContext.setNativeModuleCallExceptionHandler(mDevSupportManager);
    }

    CoreModulesPackage coreModulesPackage =
        new CoreModulesPackage(this, mBackBtnHandler);
    processPackage(coreModulesPackage, reactContext, nativeRegistryBuilder, jsModulesBuilder);

    // TODO(6818138): Solve use-case of native/js modules overriding
    for (ReactPackage reactPackage : mPackages) {
      processPackage(reactPackage, reactContext, nativeRegistryBuilder, jsModulesBuilder);
    }

    CatalystInstance.Builder catalystInstanceBuilder = new CatalystInstance.Builder()
        .setCatalystQueueConfigurationSpec(CatalystQueueConfigurationSpec.createDefault())
        .setJSExecutor(jsExecutor)
        .setRegistry(nativeRegistryBuilder.build())
        .setJSModulesConfig(jsModulesBuilder.build())
        .setJSBundleLoader(jsBundleLoader)
        .setNativeModuleCallExceptionHandler(mDevSupportManager);

    CatalystInstance catalystInstance = catalystInstanceBuilder.build();
    if (mBridgeIdleDebugListener != null) {
      catalystInstance.addBridgeIdleDebugListener(mBridgeIdleDebugListener);
    }

    reactContext.initializeWithInstance(catalystInstance);
    catalystInstance.runJSBundle();

    return reactContext;
  }

  private void processPackage(
      ReactPackage reactPackage,
      ReactApplicationContext reactContext,
      NativeModuleRegistry.Builder nativeRegistryBuilder,
      JavaScriptModulesConfig.Builder jsModulesBuilder) {
    for (NativeModule nativeModule : reactPackage.createNativeModules(reactContext)) {
      nativeRegistryBuilder.add(nativeModule);
    }
    for (Class<? extends JavaScriptModule> jsModuleClass : reactPackage.createJSModules()) {
      jsModulesBuilder.add(jsModuleClass);
    }
  }

  private void moveReactContextToCurrentLifecycleState(ReactApplicationContext reactContext) {
    if (mLifecycleState == LifecycleState.RESUMED) {
      reactContext.onResume(mCurrentActivity);
    }
  }

  /**
   * Builder class for {@link ReactInstanceManager}
   */
  public static class Builder {

    private final List<ReactPackage> mPackages = new ArrayList<>();

    private @Nullable String mJSBundleFile;
    private @Nullable String mJSMainModuleName;
    private @Nullable NotThreadSafeBridgeIdleDebugListener mBridgeIdleDebugListener;
    private @Nullable Application mApplication;
    private boolean mUseDeveloperSupport;
    private @Nullable LifecycleState mInitialLifecycleState;

    private Builder() {
    }

    /**
     * Name of the JS bundle file to be loaded from application's raw assets.
     *
     * Example: {@code "index.android.js"}
     */
    public Builder setBundleAssetName(String bundleAssetName) {
      return this.setJSBundleFile(bundleAssetName == null ? null : "assets://" + bundleAssetName);
    }

    /**
     * Path to the JS bundle file to be loaded from the file system.
     *
     * Example: {@code "assets://index.android.js" or "/sdcard/main.jsbundle}
     */
    public Builder setJSBundleFile(String jsBundleFile) {
      mJSBundleFile = jsBundleFile;
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
    public Builder setJSMainModuleName(String jsMainModuleName) {
      mJSMainModuleName = jsMainModuleName;
      return this;
    }

    public Builder addPackage(ReactPackage reactPackage) {
      mPackages.add(reactPackage);
      return this;
    }

    public Builder setBridgeIdleDebugListener(
        NotThreadSafeBridgeIdleDebugListener bridgeIdleDebugListener) {
      mBridgeIdleDebugListener = bridgeIdleDebugListener;
      return this;
    }

    /**
     * Required. This must be your {@code Application} instance.
     */
    public Builder setApplication(Application application) {
      mApplication = application;
      return this;
    }

    /**
     * When {@code true}, developer options such as JS reloading and debugging are enabled.
     * Note you still have to call {@link #showDevOptionsDialog} to show the dev menu,
     * e.g. when the device Menu button is pressed.
     */
    public Builder setUseDeveloperSupport(boolean useDeveloperSupport) {
      mUseDeveloperSupport = useDeveloperSupport;
      return this;
    }

    /**
     * Sets the initial lifecycle state of the host. For example, if the host is already resumed at
     * creation time, we wouldn't expect an onResume call until we get an onPause call.
     */
    public Builder setInitialLifecycleState(LifecycleState initialLifecycleState) {
      mInitialLifecycleState = initialLifecycleState;
      return this;
    }

    /**
     * Instantiates a new {@link ReactInstanceManager}.
     * Before calling {@code build}, the following must be called:
     * <ul>
     * <li> {@link #setApplication}
     * <li> {@link #setJSBundleFile} or {@link #setJSMainModuleName}
     * </ul>
     */
    public ReactInstanceManager build() {
      Assertions.assertCondition(
          mUseDeveloperSupport || mJSBundleFile != null,
          "JS Bundle File has to be provided when dev support is disabled");

      Assertions.assertCondition(
          mJSMainModuleName != null || mJSBundleFile != null,
          "Either MainModuleName or JS Bundle File needs to be provided");

      return new ReactInstanceManager(
          Assertions.assertNotNull(
              mApplication,
              "Application property has not been set with this builder"),
          mJSBundleFile,
          mJSMainModuleName,
          mPackages,
          mUseDeveloperSupport,
          mBridgeIdleDebugListener,
          Assertions.assertNotNull(mInitialLifecycleState, "Initial lifecycle state was not set"));
    }
  }
}
