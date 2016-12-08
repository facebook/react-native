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
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Process;
import android.view.View;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaJSExecutor;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.JavaScriptModuleRegistry;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.react.common.ApplicationHolder;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.cxxbridge.Arguments;
import com.facebook.react.cxxbridge.CatalystInstanceImpl;
import com.facebook.react.cxxbridge.JSBundleLoader;
import com.facebook.react.cxxbridge.JSCJavaScriptExecutor;
import com.facebook.react.cxxbridge.JavaScriptExecutor;
import com.facebook.react.cxxbridge.NativeModuleRegistry;
import com.facebook.react.cxxbridge.ProxyJavaScriptExecutor;
import com.facebook.react.cxxbridge.UiThreadUtil;
import com.facebook.react.devsupport.DevServerHelper;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.devsupport.DevSupportManagerFactory;
import com.facebook.react.devsupport.ReactInstanceDevCommandsHandler;
import com.facebook.react.devsupport.RedBoxHandler;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.debug.DeveloperSettings;
import com.facebook.react.uimanager.AppRegistry;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.react.bridge.ReactMarkerConstants.BUILD_NATIVE_MODULE_REGISTRY_END;
import static com.facebook.react.bridge.ReactMarkerConstants.BUILD_NATIVE_MODULE_REGISTRY_START;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_CATALYST_INSTANCE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_CATALYST_INSTANCE_START;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_REACT_CONTEXT_START;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_VIEW_MANAGERS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_VIEW_MANAGERS_START;
import static com.facebook.react.bridge.ReactMarkerConstants.PROCESS_PACKAGES_END;
import static com.facebook.react.bridge.ReactMarkerConstants.PROCESS_PACKAGES_START;
import static com.facebook.react.bridge.ReactMarkerConstants.SETUP_REACT_CONTEXT_END;
import static com.facebook.react.bridge.ReactMarkerConstants.SETUP_REACT_CONTEXT_START;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * This class is managing instances of {@link CatalystInstance}. It expose a way to configure
 * catalyst instance using {@link ReactPackage} and keeps track of the lifecycle of that
 * instance. It also sets up connection between the instance and developers support functionality
 * of the framework.
 *
 * An instance of this manager is required to start JS application in {@link ReactRootView} (see
 * {@link ReactRootView#startReactApplication} for more info).
 *
 * The lifecycle of the instance of {@link XReactInstanceManagerImpl} should be bound to the
 * activity that owns the {@link ReactRootView} that is used to render react application using this
 * instance manager (see {@link ReactRootView#startReactApplication}). It's required to pass owning
 * activity's lifecycle events to the instance manager (see {@link #onHostPause}, {@link
 * #onHostDestroy} and {@link #onHostResume}).
 *
 * To instantiate an instance of this class use {@link #builder}.
 */
/* package */ class XReactInstanceManagerImpl extends ReactInstanceManager {

  private static final String TAG = XReactInstanceManagerImpl.class.getSimpleName();

  /* should only be accessed from main thread (UI thread) */
  private final List<ReactRootView> mAttachedRootViews = new ArrayList<>();
  private LifecycleState mLifecycleState;
  private @Nullable ReactContextInitParams mPendingReactContextInitParams;
  private @Nullable ReactContextInitAsyncTask mReactContextInitAsyncTask;

  /* accessed from any thread */
  private final @Nullable JSBundleLoader mBundleLoader; /* path to JS bundle on file system */
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
  private final Collection<ReactInstanceEventListener> mReactInstanceEventListeners =
      Collections.synchronizedSet(new HashSet<ReactInstanceEventListener>());
  private volatile boolean mHasStartedCreatingInitialContext = false;
  private final UIImplementationProvider mUIImplementationProvider;
  private final MemoryPressureRouter mMemoryPressureRouter;
  private final @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  private final JSCConfig mJSCConfig;
  private final boolean mLazyNativeModulesEnabled;
  private final boolean mLazyViewManagersEnabled;

  private final ReactInstanceDevCommandsHandler mDevInterface =
      new ReactInstanceDevCommandsHandler() {

        @Override
        public void onReloadWithJSDebugger(JavaJSExecutor.Factory jsExecutorFactory) {
          XReactInstanceManagerImpl.this.onReloadWithJSDebugger(jsExecutorFactory);
        }

        @Override
        public void onJSBundleLoadedFromServer() {
          XReactInstanceManagerImpl.this.onJSBundleLoadedFromServer();
        }

        @Override
        public void toggleElementInspector() {
          XReactInstanceManagerImpl.this.toggleElementInspector();
        }
      };

  private final DefaultHardwareBackBtnHandler mBackBtnHandler =
      new DefaultHardwareBackBtnHandler() {
        @Override
        public void invokeDefaultOnBackPressed() {
          XReactInstanceManagerImpl.this.invokeDefaultOnBackPressed();
        }
      };

  private class ReactContextInitParams {
    private final JavaScriptExecutor.Factory mJsExecutorFactory;
    private final JSBundleLoader mJsBundleLoader;

    public ReactContextInitParams(
        JavaScriptExecutor.Factory jsExecutorFactory,
        JSBundleLoader jsBundleLoader) {
      mJsExecutorFactory = Assertions.assertNotNull(jsExecutorFactory);
      mJsBundleLoader = Assertions.assertNotNull(jsBundleLoader);
    }

    public JavaScriptExecutor.Factory getJsExecutorFactory() {
      return mJsExecutorFactory;
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
      AsyncTask<ReactContextInitParams, Void, Result<ReactApplicationContext>> {
    @Override
    protected void onPreExecute() {
      if (mCurrentReactContext != null) {
        tearDownReactContext(mCurrentReactContext);
        mCurrentReactContext = null;
      }
    }

    @Override
    protected Result<ReactApplicationContext> doInBackground(ReactContextInitParams... params) {
      // TODO(t11687218): Look over all threading
      // Default priority is Process.THREAD_PRIORITY_BACKGROUND which means we'll be put in a cgroup
      // that only has access to a small fraction of CPU time. The priority will be reset after
      // this task finishes: https://android.googlesource.com/platform/frameworks/base/+/d630f105e8bc0021541aacb4dc6498a49048ecea/core/java/android/os/AsyncTask.java#256
      Process.setThreadPriority(Process.THREAD_PRIORITY_DEFAULT);

      Assertions.assertCondition(params != null && params.length > 0 && params[0] != null);
      try {
        JavaScriptExecutor jsExecutor = params[0].getJsExecutorFactory().create();
        return Result.of(createReactContext(jsExecutor, params[0].getJsBundleLoader()));
      } catch (Exception e) {
        // Pass exception to onPostExecute() so it can be handled on the main thread
        return Result.of(e);
      }
    }

    @Override
    protected void onPostExecute(Result<ReactApplicationContext> result) {
      try {
        setupReactContext(result.get());
      } catch (Exception e) {
        mDevSupportManager.handleException(e);
      } finally {
        mReactContextInitAsyncTask = null;
      }

      // Handle enqueued request to re-initialize react context.
      if (mPendingReactContextInitParams != null) {
        recreateReactContextInBackground(
            mPendingReactContextInitParams.getJsExecutorFactory(),
            mPendingReactContextInitParams.getJsBundleLoader());
        mPendingReactContextInitParams = null;
      }
    }

    @Override
    protected void onCancelled(Result<ReactApplicationContext> reactApplicationContextResult) {
      try {
        mMemoryPressureRouter.destroy(reactApplicationContextResult.get());
      } catch (Exception e) {
        FLog.w(ReactConstants.TAG, "Caught exception after cancelling react context init", e);
      } finally {
        mReactContextInitAsyncTask = null;
      }
    }
  }

  private static class Result<T> {
    @Nullable private final T mResult;
    @Nullable private final Exception mException;

    public static <T, U extends T> Result<T> of(U result) {
      return new Result<T>(result);
    }

    public static <T> Result<T> of(Exception exception) {
      return new Result<>(exception);
    }

    private Result(T result) {
      mException = null;
      mResult = result;
    }

    private Result(Exception exception) {
      mException = exception;
      mResult = null;
    }

    public T get() throws Exception {
      if (mException != null) {
        throw mException;
      }

      Assertions.assertNotNull(mResult);

      return mResult;
    }
  }

  /* package */ XReactInstanceManagerImpl(
    Context applicationContext,
    @Nullable Activity currentActivity,
    @Nullable DefaultHardwareBackBtnHandler defaultHardwareBackBtnHandler,
    @Nullable JSBundleLoader bundleLoader,
    @Nullable String jsMainModuleName,
    List<ReactPackage> packages,
    boolean useDeveloperSupport,
    @Nullable NotThreadSafeBridgeIdleDebugListener bridgeIdleDebugListener,
    LifecycleState initialLifecycleState,
    UIImplementationProvider uiImplementationProvider,
    NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler,
    JSCConfig jscConfig,
    @Nullable RedBoxHandler redBoxHandler,
    boolean lazyNativeModulesEnabled,
    boolean lazyViewManagersEnabled) {

    initializeSoLoaderIfNecessary(applicationContext);

    // TODO(9577825): remove this
    ApplicationHolder.setApplication((Application) applicationContext.getApplicationContext());
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(applicationContext);

    mApplicationContext = applicationContext;
    mCurrentActivity = currentActivity;
    mDefaultBackButtonImpl = defaultHardwareBackBtnHandler;
    mBundleLoader = bundleLoader;
    mJSMainModuleName = jsMainModuleName;
    mPackages = packages;
    mUseDeveloperSupport = useDeveloperSupport;
    mDevSupportManager = DevSupportManagerFactory.create(
        applicationContext,
        mDevInterface,
        mJSMainModuleName,
        useDeveloperSupport,
        redBoxHandler);
    mBridgeIdleDebugListener = bridgeIdleDebugListener;
    mLifecycleState = initialLifecycleState;
    mUIImplementationProvider = uiImplementationProvider;
    mMemoryPressureRouter = new MemoryPressureRouter(applicationContext);
    mNativeModuleCallExceptionHandler = nativeModuleCallExceptionHandler;
    mJSCConfig = jscConfig;
    mLazyNativeModulesEnabled = lazyNativeModulesEnabled;
    mLazyViewManagersEnabled = lazyViewManagersEnabled;
  }

  @Override
  public DevSupportManager getDevSupportManager() {
    return mDevSupportManager;
  }

  @Override
  public MemoryPressureRouter getMemoryPressureRouter() {
    return mMemoryPressureRouter;
  }

  private static void initializeSoLoaderIfNecessary(Context applicationContext) {
    // Call SoLoader.initialize here, this is required for apps that does not use exopackage and
    // does not use SoLoader for loading other native code except from the one used by React Native
    // This way we don't need to require others to have additional initialization code and to
    // subclass android.app.Application.

    // Method SoLoader.init is idempotent, so if you wish to use native exopackage, just call
    // SoLoader.init with appropriate args before initializing XReactInstanceManagerImpl
    SoLoader.init(applicationContext, /* native exopackage */ false);
  }

  /**
   * Trigger react context initialization asynchronously in a background async task. This enables
   * applications to pre-load the application JS, and execute global code before
   * {@link ReactRootView} is available and measured. This should only be called the first time the
   * application is set up, which is enforced to keep developers from accidentally creating their
   * application multiple times without realizing it.
   *
   * Called from UI thread.
   */
  @Override
  public void createReactContextInBackground() {
    Assertions.assertCondition(
        !mHasStartedCreatingInitialContext,
        "createReactContextInBackground should only be called when creating the react " +
            "application for the first time. When reloading JS, e.g. from a new file, explicitly" +
            "use recreateReactContextInBackground");

    mHasStartedCreatingInitialContext = true;
    recreateReactContextInBackgroundInner();
  }

  /**
   * Recreate the react application and context. This should be called if configuration has
   * changed or the developer has requested the app to be reloaded. It should only be called after
   * an initial call to createReactContextInBackground.
   *
   * Called from UI thread.
   */
  public void recreateReactContextInBackground() {
    Assertions.assertCondition(
        mHasStartedCreatingInitialContext,
        "recreateReactContextInBackground should only be called after the initial " +
            "createReactContextInBackground call.");
    recreateReactContextInBackgroundInner();
  }

  private void recreateReactContextInBackgroundInner() {
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport && mJSMainModuleName != null) {
      final DeveloperSettings devSettings = mDevSupportManager.getDevSettings();

      // If remote JS debugging is enabled, load from dev server.
      if (mDevSupportManager.hasUpToDateJSBundleInCache() &&
          !devSettings.isRemoteJSDebugEnabled()) {
        // If there is a up-to-date bundle downloaded from server,
        // with remote JS debugging disabled, always use that.
        onJSBundleLoadedFromServer();
      } else if (mBundleLoader == null) {
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
                          // If dev server is down, disable the remote JS debugging.
                          devSettings.setRemoteJSDebugEnabled(false);
                          recreateReactContextInBackgroundFromBundleLoader();
                        }
                      }
                    });
              }
            });
      }
      return;
    }

    recreateReactContextInBackgroundFromBundleLoader();
  }

  private void recreateReactContextInBackgroundFromBundleLoader() {
    recreateReactContextInBackground(
        new JSCJavaScriptExecutor.Factory(mJSCConfig.getConfigMap()),
        mBundleLoader);
  }

  /**
   * @return whether createReactContextInBackground has been called. Will return false after
   * onDestroy until a new initial context has been created.
   */
  public boolean hasStartedCreatingInitialContext() {
    return mHasStartedCreatingInitialContext;
  }

  /**
   * This method will give JS the opportunity to consume the back button event. If JS does not
   * consume the event, mDefaultBackButtonImpl will be invoked at the end of the round trip to JS.
   */
  @Override
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

  @Override
  public void onNewIntent(Intent intent) {
    if (mCurrentReactContext == null) {
      FLog.w(ReactConstants.TAG, "Instance detached from instance manager");
    } else {
      String action = intent.getAction();
      Uri uri = intent.getData();

      if (Intent.ACTION_VIEW.equals(action) && uri != null) {
        DeviceEventManagerModule deviceEventManagerModule =
                Assertions.assertNotNull(mCurrentReactContext).getNativeModule(DeviceEventManagerModule.class);
        deviceEventManagerModule.emitNewIntentReceived(uri);
      }

      mCurrentReactContext.onNewIntent(mCurrentActivity, intent);
    }
  }

  private void toggleElementInspector() {
    if (mCurrentReactContext != null) {
      mCurrentReactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("toggleElementInspector", null);
    }
  }

  @Override
  public void onHostPause() {
    UiThreadUtil.assertOnUiThread();

    mDefaultBackButtonImpl = null;
    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    moveToBeforeResumeLifecycleState();
  }

  @Override
  public void onHostPause(Activity activity) {
    Assertions.assertNotNull(mCurrentActivity);
    Assertions.assertCondition(
      activity == mCurrentActivity,
      "Pausing an activity that is not the current activity, this is incorrect! " +
        "Current activity: " + mCurrentActivity.getClass().getSimpleName() + " " +
        "Paused activity: " + activity.getClass().getSimpleName());
    onHostPause();
  }

  /**
   * Use this method when the activity resumes to enable invoking the back button directly from JS.
   *
   * This method retains an instance to provided mDefaultBackButtonImpl. Thus it's important to pass
   * from the activity instance that owns this particular instance of {@link
   * XReactInstanceManagerImpl}, so that once this instance receive {@link #onHostDestroy} event it
   * will clear the reference to that defaultBackButtonImpl.
   *
   * @param defaultBackButtonImpl a {@link DefaultHardwareBackBtnHandler} from an Activity that owns
   * this instance of {@link XReactInstanceManagerImpl}.
   */
  @Override
  public void onHostResume(Activity activity, DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
    UiThreadUtil.assertOnUiThread();

    mDefaultBackButtonImpl = defaultBackButtonImpl;
    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(true);
    }

    mCurrentActivity = activity;
    moveToResumedLifecycleState(false);
  }

  @Override
  public void onHostDestroy() {
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    moveToBeforeCreateLifecycleState();
    mCurrentActivity = null;
  }

  @Override
  public void onHostDestroy(Activity activity) {
    if (activity == mCurrentActivity) {
      onHostDestroy();
    }
  }

  @Override
  public void destroy() {
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    moveToBeforeCreateLifecycleState();

    if (mReactContextInitAsyncTask != null) {
      mReactContextInitAsyncTask.cancel(true);
    }

    mMemoryPressureRouter.destroy(mApplicationContext);

    if (mCurrentReactContext != null) {
      mCurrentReactContext.destroy();
      mCurrentReactContext = null;
      mHasStartedCreatingInitialContext = false;
    }
    mCurrentActivity = null;

    ResourceDrawableIdHelper.getInstance().clear();
  }

  private void moveToResumedLifecycleState(boolean force) {
    if (mCurrentReactContext != null) {
      // we currently don't have an onCreate callback so we call onResume for both transitions
      if (force ||
          mLifecycleState == LifecycleState.BEFORE_RESUME ||
          mLifecycleState == LifecycleState.BEFORE_CREATE) {
        mCurrentReactContext.onHostResume(mCurrentActivity);
      }
    }
    mLifecycleState = LifecycleState.RESUMED;
  }

  private void moveToBeforeResumeLifecycleState() {
    if (mCurrentReactContext != null) {
      if (mLifecycleState == LifecycleState.BEFORE_CREATE) {
        mCurrentReactContext.onHostResume(mCurrentActivity);
        mCurrentReactContext.onHostPause();
      } else if (mLifecycleState == LifecycleState.RESUMED) {
        mCurrentReactContext.onHostPause();
      }
    }
    mLifecycleState = LifecycleState.BEFORE_RESUME;
  }

  private void moveToBeforeCreateLifecycleState() {
    if (mCurrentReactContext != null) {
      if (mLifecycleState == LifecycleState.RESUMED) {
        mCurrentReactContext.onHostPause();
        mLifecycleState = LifecycleState.BEFORE_RESUME;
      }
      if (mLifecycleState == LifecycleState.BEFORE_RESUME) {
        mCurrentReactContext.onHostDestroy();
      }
    }
    mLifecycleState = LifecycleState.BEFORE_CREATE;
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (mCurrentReactContext != null) {
      mCurrentReactContext.onActivityResult(activity, requestCode, resultCode, data);
    }
  }

  @Override
  public void showDevOptionsDialog() {
    UiThreadUtil.assertOnUiThread();
    mDevSupportManager.showDevOptionsDialog();
  }

  /**
   * Get the URL where the last bundle was loaded from.
   */
  @Override
  public String getSourceUrl() {
    return Assertions.assertNotNull(mSourceUrl);
  }

  @Override
  public @Nullable String getJSBundleFile() {
    if (mBundleLoader == null) {
      return null;
    }
    return mBundleLoader.getSourceUrl();
  }

  /**
   * Attach given {@param rootView} to a catalyst instance manager and start JS application using
   * JS module provided by {@link ReactRootView#getJSModuleName}. If the react context is currently
   * being (re)-created, or if react context has not been created yet, the JS application associated
   * with the provided root view will be started asynchronously, i.e this method won't block.
   * This view will then be tracked by this manager and in case of catalyst instance restart it will
   * be re-attached.
   */
  @Override
  public void attachMeasuredRootView(ReactRootView rootView) {
    UiThreadUtil.assertOnUiThread();
    mAttachedRootViews.add(rootView);

    // If react context is being created in the background, JS application will be started
    // automatically when creation completes, as root view is part of the attached root view list.
    if (mReactContextInitAsyncTask == null && mCurrentReactContext != null) {
      attachMeasuredRootViewToInstance(rootView, mCurrentReactContext.getCatalystInstance());
    }
  }

  /**
   * Detach given {@param rootView} from current catalyst instance. It's safe to call this method
   * multiple times on the same {@param rootView} - in that case view will be detached with the
   * first call.
   */
  @Override
  public void detachRootView(ReactRootView rootView) {
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
  @Override
  public List<ViewManager> createAllViewManagers(
      ReactApplicationContext catalystApplicationContext) {
    ReactMarker.logMarker(CREATE_VIEW_MANAGERS_START);
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createAllViewManagers");
    try {
      List<ViewManager> allViewManagers = new ArrayList<>();
      for (ReactPackage reactPackage : mPackages) {
        allViewManagers.addAll(reactPackage.createViewManagers(catalystApplicationContext));
      }
      return allViewManagers;
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_VIEW_MANAGERS_END);
    }
  }

  @Override
  public void addReactInstanceEventListener(ReactInstanceEventListener listener) {
    mReactInstanceEventListeners.add(listener);
  }

  @Override
  public void removeReactInstanceEventListener(ReactInstanceEventListener listener) {
    mReactInstanceEventListeners.remove(listener);
  }

  @VisibleForTesting
  @Override
  public @Nullable ReactContext getCurrentReactContext() {
    return mCurrentReactContext;
  }

  @Override
  public LifecycleState getLifecycleState() {
    return mLifecycleState;
  }

  private void onReloadWithJSDebugger(JavaJSExecutor.Factory jsExecutorFactory) {
    recreateReactContextInBackground(
        new ProxyJavaScriptExecutor.Factory(jsExecutorFactory),
        JSBundleLoader.createRemoteDebuggerBundleLoader(
            mDevSupportManager.getJSBundleURLForRemoteDebugging(),
            mDevSupportManager.getSourceUrl()));
  }

  private void onJSBundleLoadedFromServer() {
    recreateReactContextInBackground(
        new JSCJavaScriptExecutor.Factory(mJSCConfig.getConfigMap()),
        JSBundleLoader.createCachedBundleFromNetworkLoader(
            mDevSupportManager.getSourceUrl(),
            mDevSupportManager.getDownloadedJSBundleFile()));
  }

  private void recreateReactContextInBackground(
      JavaScriptExecutor.Factory jsExecutorFactory,
      JSBundleLoader jsBundleLoader) {
    UiThreadUtil.assertOnUiThread();

    ReactContextInitParams initParams =
        new ReactContextInitParams(jsExecutorFactory, jsBundleLoader);
    if (mReactContextInitAsyncTask == null) {
      // No background task to create react context is currently running, create and execute one.
      mReactContextInitAsyncTask = new ReactContextInitAsyncTask();
      mReactContextInitAsyncTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, initParams);
    } else {
      // Background task is currently running, queue up most recent init params to recreate context
      // once task completes.
      mPendingReactContextInitParams = initParams;
    }
  }

  private void setupReactContext(ReactApplicationContext reactContext) {
    ReactMarker.logMarker(SETUP_REACT_CONTEXT_START);
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "setupReactContext");
    UiThreadUtil.assertOnUiThread();
    Assertions.assertCondition(mCurrentReactContext == null);
    mCurrentReactContext = Assertions.assertNotNull(reactContext);
    CatalystInstance catalystInstance =
        Assertions.assertNotNull(reactContext.getCatalystInstance());

    catalystInstance.initialize();
    mDevSupportManager.onNewReactContextCreated(reactContext);
    mMemoryPressureRouter.addMemoryPressureListener(catalystInstance);
    moveReactContextToCurrentLifecycleState();

    for (ReactRootView rootView : mAttachedRootViews) {
      attachMeasuredRootViewToInstance(rootView, catalystInstance);
    }

    ReactInstanceEventListener[] listeners =
      new ReactInstanceEventListener[mReactInstanceEventListeners.size()];
    listeners = mReactInstanceEventListeners.toArray(listeners);

    for (ReactInstanceEventListener listener : listeners) {
      listener.onReactContextInitialized(reactContext);
    }
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    ReactMarker.logMarker(SETUP_REACT_CONTEXT_END);
  }

  private void attachMeasuredRootViewToInstance(
      ReactRootView rootView,
      CatalystInstance catalystInstance) {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "attachMeasuredRootViewToInstance");
    UiThreadUtil.assertOnUiThread();

    // Reset view content as it's going to be populated by the application content from JS
    rootView.removeAllViews();
    rootView.setId(View.NO_ID);

    UIManagerModule uiManagerModule = catalystInstance.getNativeModule(UIManagerModule.class);
    int rootTag = uiManagerModule.addMeasuredRootView(rootView);
    rootView.setRootViewTag(rootTag);
    @Nullable Bundle launchOptions = rootView.getLaunchOptions();
    WritableMap initialProps = Arguments.makeNativeMap(launchOptions);
    String jsAppModuleName = rootView.getJSModuleName();

    WritableNativeMap appParams = new WritableNativeMap();
    appParams.putDouble("rootTag", rootTag);
    appParams.putMap("initialProps", initialProps);
    catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
    rootView.onAttachedToReactInstance();
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  private void detachViewFromInstance(
      ReactRootView rootView,
      CatalystInstance catalystInstance) {
    UiThreadUtil.assertOnUiThread();
    catalystInstance.getJSModule(AppRegistry.class)
        .unmountApplicationComponentAtRootTag(rootView.getId());
  }

  private void tearDownReactContext(ReactContext reactContext) {
    UiThreadUtil.assertOnUiThread();
    if (mLifecycleState == LifecycleState.RESUMED) {
      reactContext.onHostPause();
    }
    for (ReactRootView rootView : mAttachedRootViews) {
      detachViewFromInstance(rootView, reactContext.getCatalystInstance());
    }
    reactContext.destroy();
    mDevSupportManager.onReactInstanceDestroyed(reactContext);
    mMemoryPressureRouter.removeMemoryPressureListener(reactContext.getCatalystInstance());
  }

  /**
   * @return instance of {@link ReactContext} configured a {@link CatalystInstance} set
   */
  private ReactApplicationContext createReactContext(
      JavaScriptExecutor jsExecutor,
      JSBundleLoader jsBundleLoader) {
    FLog.i(ReactConstants.TAG, "Creating react context.");
    ReactMarker.logMarker(CREATE_REACT_CONTEXT_START);
    mSourceUrl = jsBundleLoader.getSourceUrl();
    List<ModuleSpec> moduleSpecs = new ArrayList<>();
    Map<Class, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
    JavaScriptModuleRegistry.Builder jsModulesBuilder = new JavaScriptModuleRegistry.Builder();

    final ReactApplicationContext reactContext = new ReactApplicationContext(mApplicationContext);
    if (mUseDeveloperSupport) {
      reactContext.setNativeModuleCallExceptionHandler(mDevSupportManager);
    }

    ReactMarker.logMarker(PROCESS_PACKAGES_START);
    Systrace.beginSection(
        TRACE_TAG_REACT_JAVA_BRIDGE,
        "createAndProcessCoreModulesPackage");
    try {
      CoreModulesPackage coreModulesPackage =
        new CoreModulesPackage(this, mBackBtnHandler, mUIImplementationProvider);
      processPackage(
        coreModulesPackage,
        reactContext,
        moduleSpecs,
        reactModuleInfoMap,
        jsModulesBuilder);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }

    // TODO(6818138): Solve use-case of native/js modules overriding
    for (ReactPackage reactPackage : mPackages) {
      Systrace.beginSection(
          TRACE_TAG_REACT_JAVA_BRIDGE,
          "createAndProcessCustomReactPackage");
      try {
        processPackage(
          reactPackage,
          reactContext,
          moduleSpecs,
          reactModuleInfoMap,
          jsModulesBuilder);
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
    ReactMarker.logMarker(PROCESS_PACKAGES_END);

    ReactMarker.logMarker(BUILD_NATIVE_MODULE_REGISTRY_START);
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "buildNativeModuleRegistry");
    NativeModuleRegistry nativeModuleRegistry;
    try {
       nativeModuleRegistry = new NativeModuleRegistry(moduleSpecs, reactModuleInfoMap);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(BUILD_NATIVE_MODULE_REGISTRY_END);
    }

    NativeModuleCallExceptionHandler exceptionHandler = mNativeModuleCallExceptionHandler != null
        ? mNativeModuleCallExceptionHandler
        : mDevSupportManager;
    CatalystInstanceImpl.Builder catalystInstanceBuilder = new CatalystInstanceImpl.Builder()
        .setReactQueueConfigurationSpec(ReactQueueConfigurationSpec.createDefault())
        .setJSExecutor(jsExecutor)
        .setRegistry(nativeModuleRegistry)
        .setJSModuleRegistry(jsModulesBuilder.build())
        .setJSBundleLoader(jsBundleLoader)
        .setNativeModuleCallExceptionHandler(exceptionHandler);

    ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_START);
    // CREATE_CATALYST_INSTANCE_END is in JSCExecutor.cpp
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createCatalystInstance");
    final CatalystInstance catalystInstance;
    try {
      catalystInstance = catalystInstanceBuilder.build();
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_CATALYST_INSTANCE_END);
    }

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
    List<ModuleSpec> moduleSpecs,
    Map<Class, ReactModuleInfo> reactModuleInfoMap,
    JavaScriptModuleRegistry.Builder jsModulesBuilder) {
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "processPackage")
      .arg("className", reactPackage.getClass().getSimpleName())
      .flush();
    if (mLazyNativeModulesEnabled && reactPackage instanceof LazyReactPackage) {
      LazyReactPackage lazyReactPackage = (LazyReactPackage) reactPackage;
      ReactModuleInfoProvider instance = lazyReactPackage.getReactModuleInfoProvider();
      Map<Class, ReactModuleInfo> map = instance.getReactModuleInfos();
      if (!map.isEmpty()) {
        reactModuleInfoMap.putAll(map);
      }
      moduleSpecs.addAll(lazyReactPackage.getNativeModules(reactContext));
    } else {
      FLog.d(
        ReactConstants.TAG,
        reactPackage.getClass().getSimpleName() +
          " is not a LazyReactPackage, falling back to old version.");
      for (NativeModule nativeModule : reactPackage.createNativeModules(reactContext)) {
        moduleSpecs.add(
            new ModuleSpec(nativeModule.getClass(), new EagerModuleProvider(nativeModule)));
      }
    }

    for (Class<? extends JavaScriptModule> jsModuleClass : reactPackage.createJSModules()) {
      jsModulesBuilder.add(jsModuleClass);
    }
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  private void moveReactContextToCurrentLifecycleState() {
    if (mLifecycleState == LifecycleState.RESUMED) {
      moveToResumedLifecycleState(true);
    }
  }
}
