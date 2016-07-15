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
import android.content.Intent;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.devsupport.RedBoxHandler;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.ViewManager;

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
 * owning activity's lifecycle events to the instance manager (see {@link #onHostPause},
 * {@link #onHostDestroy} and {@link #onHostResume}).
 *
 * Ideally, this would be an interface, but because of the API used by earlier versions, it has to
 * have a static method, and so cannot (in Java < 8), be one.
 */
public abstract class ReactInstanceManager {

  /**
   * Listener interface for react instance events.
   */
  public interface ReactInstanceEventListener {
    /**
     * Called when the react context is initialized (all modules registered). Always called on the
     * UI thread.
     */
    void onReactContextInitialized(ReactContext context);
  }

  public abstract DevSupportManager getDevSupportManager();

  public abstract MemoryPressureRouter getMemoryPressureRouter();

  /**
   * Trigger react context initialization asynchronously in a background async task. This enables
   * applications to pre-load the application JS, and execute global code before
   * {@link ReactRootView} is available and measured. This should only be called the first time the
   * application is set up, which is enforced to keep developers from accidentally creating their
   * application multiple times without realizing it.
   *
   * Called from UI thread.
   */
  public abstract void createReactContextInBackground();

  /**
   * @return whether createReactContextInBackground has been called. Will return false after
   * onDestroy until a new initial context has been created.
   */
  public abstract boolean hasStartedCreatingInitialContext();

  /**
   * This method will give JS the opportunity to consume the back button event. If JS does not
   * consume the event, mDefaultBackButtonImpl will be invoked at the end of the round trip to JS.
   */
  public abstract void onBackPressed();

  /**
   * This method will give JS the opportunity to receive intents via Linking.
   */
  public abstract void onNewIntent(Intent intent);

  /**
   * Call this from {@link Activity#onPause()}. This notifies any listening modules so they can do
   * any necessary cleanup.
   */
  public abstract void onHostPause();
  /**
   * Use this method when the activity resumes to enable invoking the back button directly from JS.
   *
   * This method retains an instance to provided mDefaultBackButtonImpl. Thus it's
   * important to pass from the activity instance that owns this particular instance of {@link
   * ReactInstanceManager}, so that once this instance receive {@link #onHostDestroy} event it will
   * clear the reference to that defaultBackButtonImpl.
   *
   * @param defaultBackButtonImpl a {@link DefaultHardwareBackBtnHandler} from an Activity that owns
   * this instance of {@link ReactInstanceManager}.
   */
  public abstract void onHostResume(
    Activity activity,
    DefaultHardwareBackBtnHandler defaultBackButtonImpl);

  /**
   * Call this from {@link Activity#onDestroy()}. This notifies any listening modules so they can do
   * any necessary cleanup.
   */
  public abstract void onHostDestroy();
  public abstract void onActivityResult(int requestCode, int resultCode, Intent data);
  public abstract void showDevOptionsDialog();

  /**
   * Get the URL where the last bundle was loaded from.
   */
  public abstract String getSourceUrl();

  /**
   * Attach given {@param rootView} to a catalyst instance manager and start JS application using
   * JS module provided by {@link ReactRootView#getJSModuleName}. If the react context is currently
   * being (re)-created, or if react context has not been created yet, the JS application associated
   * with the provided root view will be started asynchronously, i.e this method won't block.
   * This view will then be tracked by this manager and in case of catalyst instance restart it will
   * be re-attached.
   */
  public abstract void attachMeasuredRootView(ReactRootView rootView);

  /**
   * Detach given {@param rootView} from current catalyst instance. It's safe to call this method
   * multiple times on the same {@param rootView} - in that case view will be detached with the
   * first call.
   */
  public abstract void detachRootView(ReactRootView rootView);

  /**
   * Destroy this React instance and the attached JS context.
   */
  public abstract void destroy();

  /**
   * Uses configured {@link ReactPackage} instances to create all view managers
   */
  public abstract List<ViewManager> createAllViewManagers(
    ReactApplicationContext catalystApplicationContext);

  /**
   * Add a listener to be notified of react instance events.
   */
  public abstract void addReactInstanceEventListener(ReactInstanceEventListener listener);

  /**
   * Remove a listener previously added with {@link #addReactInstanceEventListener}.
   */
  public abstract void removeReactInstanceEventListener(ReactInstanceEventListener listener);

  @VisibleForTesting
  public abstract @Nullable ReactContext getCurrentReactContext();

  public abstract LifecycleState getLifecycleState();

  /**
   * Creates a builder that is capable of creating an instance of {@link ReactInstanceManagerImpl}.
   */
  public static Builder builder() {
    return new Builder();
  }

  /**
   * Builder class for {@link ReactInstanceManagerImpl}
   */
  public static class Builder {

    protected final List<ReactPackage> mPackages = new ArrayList<>();

    protected @Nullable String mJSBundleFile;
    protected @Nullable String mJSMainModuleName;
    protected @Nullable NotThreadSafeBridgeIdleDebugListener mBridgeIdleDebugListener;
    protected @Nullable Application mApplication;
    protected boolean mUseDeveloperSupport;
    protected @Nullable LifecycleState mInitialLifecycleState;
    protected @Nullable UIImplementationProvider mUIImplementationProvider;
    protected @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
    protected @Nullable JSCConfig mJSCConfig;
    protected @Nullable Activity mCurrentActivity;
    protected @Nullable DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler;
    protected @Nullable RedBoxHandler mRedBoxHandler;
    protected boolean mUseNewBridge;

    protected Builder() {
    }

    /**
     * Sets a provider of {@link UIImplementation}.
     * Uses default provider if null is passed.
     */
    public Builder setUIImplementationProvider(
        @Nullable UIImplementationProvider uiImplementationProvider) {
      mUIImplementationProvider = uiImplementationProvider;
      return this;
    }

    /**
     * Name of the JS bundle file to be loaded from application's raw assets.
     * Example: {@code "index.android.js"}
     */
    public Builder setBundleAssetName(String bundleAssetName) {
      return this.setJSBundleFile(bundleAssetName == null ? null : "assets://" + bundleAssetName);
    }

    /**
     * Path to the JS bundle file to be loaded from the file system.
     *
     * Example: {@code "assets://index.android.js" or "/sdcard/main.jsbundle"}
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

    public Builder setCurrentActivity(Activity activity) {
      mCurrentActivity = activity;
      return this;
    }

    public Builder setDefaultHardwareBackBtnHandler(
        DefaultHardwareBackBtnHandler defaultHardwareBackBtnHandler) {
      mDefaultHardwareBackBtnHandler = defaultHardwareBackBtnHandler;
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
     * Set the exception handler for all native module calls. If not set, the default
     * {@link DevSupportManager} will be used, which shows a redbox in dev mode and rethrows
     * (crashes the app) in prod mode.
     */
    public Builder setNativeModuleCallExceptionHandler(NativeModuleCallExceptionHandler handler) {
      mNativeModuleCallExceptionHandler = handler;
      return this;
    }

    public Builder setJSCConfig(JSCConfig jscConfig) {
      mJSCConfig = jscConfig;
      return this;
    }

    public Builder setRedBoxHandler(@Nullable RedBoxHandler redBoxHandler) {
      mRedBoxHandler = redBoxHandler;
      return this;
    }

    public Builder setUseNewBridge() {
      mUseNewBridge = true;
      return this;
    }

    /**
     * Instantiates a new {@link ReactInstanceManagerImpl}.
     * Before calling {@code build}, the following must be called:
     * <ul>
     * <li> {@link #setApplication}
     * <li> {@link #setCurrentActivity} if the activity has already resumed
     * <li> {@link #setDefaultHardwareBackBtnHandler} if the activity has already resumed
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

      if (mUIImplementationProvider == null) {
        // create default UIImplementationProvider if the provided one is null.
        mUIImplementationProvider = new UIImplementationProvider();
      }

      if (mUseNewBridge) {
        return new XReactInstanceManagerImpl(
            Assertions.assertNotNull(
                mApplication,
                "Application property has not been set with this builder"),
            mCurrentActivity,
            mDefaultHardwareBackBtnHandler,
            mJSBundleFile,
            mJSMainModuleName,
            mPackages,
            mUseDeveloperSupport,
            mBridgeIdleDebugListener,
            Assertions.assertNotNull(mInitialLifecycleState, "Initial lifecycle state was not set"),
            mUIImplementationProvider,
            mNativeModuleCallExceptionHandler,
            mJSCConfig,
            mRedBoxHandler);
      } else {
        return new ReactInstanceManagerImpl(
            Assertions.assertNotNull(
                mApplication,
                "Application property has not been set with this builder"),
            mCurrentActivity,
            mDefaultHardwareBackBtnHandler,
            mJSBundleFile,
            mJSMainModuleName,
            mPackages,
            mUseDeveloperSupport,
            mBridgeIdleDebugListener,
            Assertions.assertNotNull(mInitialLifecycleState, "Initial lifecycle state was not set"),
            mUIImplementationProvider,
            mNativeModuleCallExceptionHandler,
            mJSCConfig,
            mRedBoxHandler);
      }
    }
  }
}
