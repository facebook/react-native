/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.app.Application;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.UIManagerProvider;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.SurfaceDelegate;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.devsupport.DevSupportManagerFactory;
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.internal.ChoreographerProvider;
import java.util.List;

/**
 * Simple class that holds an instance of {@link ReactInstanceManager}. This can be used in your
 * {@link Application class} (see {@link ReactApplication}), or as a static field.
 */
@DeprecatedInNewArchitecture(
    message =
        "This class will be replaced by com.facebook.react.ReactHost in the new architecture of React Native.")
public abstract class ReactNativeHost {

  private final Application mApplication;
  private @Nullable ReactInstanceManager mReactInstanceManager;

  protected ReactNativeHost(Application application) {
    mApplication = application;
  }

  /** Get the current {@link ReactInstanceManager} instance, or create one. */
  public ReactInstanceManager getReactInstanceManager() {
    if (mReactInstanceManager == null) {
      ReactMarker.logMarker(ReactMarkerConstants.INIT_REACT_RUNTIME_START);
      ReactMarker.logMarker(ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_START);
      mReactInstanceManager = createReactInstanceManager();
      ReactMarker.logMarker(ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_END);
    }
    return mReactInstanceManager;
  }

  /**
   * Get whether this holder contains a {@link ReactInstanceManager} instance, or not. I.e. if
   * {@link #getReactInstanceManager()} has been called at least once since this object was created
   * or {@link #clear()} was called.
   */
  public boolean hasInstance() {
    return mReactInstanceManager != null;
  }

  /**
   * Destroy the current instance and release the internal reference to it, allowing it to be GCed.
   */
  public void clear() {
    if (mReactInstanceManager != null) {
      mReactInstanceManager.destroy();
      mReactInstanceManager = null;
    }
  }

  protected ReactInstanceManager createReactInstanceManager() {
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_START);
    ReactInstanceManagerBuilder builder =
        ReactInstanceManager.builder()
            .setApplication(mApplication)
            .setJSMainModulePath(getJSMainModuleName())
            .setUseDeveloperSupport(getUseDeveloperSupport())
            .setDevSupportManagerFactory(getDevSupportManagerFactory())
            .setDevLoadingViewManager(getDevLoadingViewManager())
            .setRequireActivity(getShouldRequireActivity())
            .setSurfaceDelegateFactory(getSurfaceDelegateFactory())
            .setLazyViewManagersEnabled(getLazyViewManagersEnabled())
            .setRedBoxHandler(getRedBoxHandler())
            .setJavaScriptExecutorFactory(getJavaScriptExecutorFactory())
            .setUIManagerProvider(getUIManagerProvider())
            .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)
            .setReactPackageTurboModuleManagerDelegateBuilder(
                getReactPackageTurboModuleManagerDelegateBuilder())
            .setJSEngineResolutionAlgorithm(getJSEngineResolutionAlgorithm())
            .setChoreographerProvider(getChoreographerProvider());

    for (ReactPackage reactPackage : getPackages()) {
      builder.addPackage(reactPackage);
    }

    String jsBundleFile = getJSBundleFile();
    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile);
    } else {
      builder.setBundleAssetName(Assertions.assertNotNull(getBundleAssetName()));
    }
    ReactInstanceManager reactInstanceManager = builder.build();
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_END);
    return reactInstanceManager;
  }

  /** Get the {@link RedBoxHandler} to send RedBox-related callbacks to. */
  protected @Nullable RedBoxHandler getRedBoxHandler() {
    return null;
  }

  /** Get the {@link JavaScriptExecutorFactory}. Override this to use a custom Executor. */
  protected @Nullable JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
    return null;
  }

  protected @Nullable ReactPackageTurboModuleManagerDelegate.Builder
      getReactPackageTurboModuleManagerDelegateBuilder() {
    return null;
  }

  protected final Application getApplication() {
    return mApplication;
  }

  protected @Nullable UIManagerProvider getUIManagerProvider() {
    return reactApplicationContext -> null;
  }

  /** Returns whether or not to treat it as normal if Activity is null. */
  public boolean getShouldRequireActivity() {
    return true;
  }

  /**
   * Returns whether view managers should be created lazily. See {@link
   * ViewManagerOnDemandReactPackage} for details.
   *
   * @experimental
   */
  public boolean getLazyViewManagersEnabled() {
    return false;
  }

  /**
   * Return the {@link SurfaceDelegateFactory} used by NativeModules to get access to a {@link
   * SurfaceDelegate} to interact with a surface. By default in the mobile platform the {@link
   * SurfaceDelegate} it returns is null, and the NativeModule needs to implement its own {@link
   * SurfaceDelegate} to decide how it would interact with its own container surface.
   */
  public SurfaceDelegateFactory getSurfaceDelegateFactory() {
    return new SurfaceDelegateFactory() {
      @Override
      public @Nullable SurfaceDelegate createSurfaceDelegate(String moduleName) {
        return null;
      }
    };
  }

  /**
   * Get the {@link DevLoadingViewManager}. Override this to use a custom dev loading view manager
   */
  protected @Nullable DevLoadingViewManager getDevLoadingViewManager() {
    return null;
  }

  /**
   * Returns the name of the main module. Determines the URL used to fetch the JS bundle from Metro.
   * It is only used when dev support is enabled. This is the first file to be executed once the
   * {@link ReactInstanceManager} is created. e.g. "index.android"
   */
  protected String getJSMainModuleName() {
    return "index.android";
  }

  /**
   * Returns a custom path of the bundle file. This is used in cases the bundle should be loaded
   * from a custom path. By default it is loaded from Android assets, from a path specified by
   * {@link getBundleAssetName}. e.g. "file://sdcard/myapp_cache/index.android.bundle"
   */
  protected @Nullable String getJSBundleFile() {
    return null;
  }

  /**
   * Returns the name of the bundle in assets. If this is null, and no file path is specified for
   * the bundle, the app will only work with {@code getUseDeveloperSupport} enabled and will always
   * try to load the JS bundle from Metro. e.g. "index.android.bundle"
   */
  protected @Nullable String getBundleAssetName() {
    return "index.android.bundle";
  }

  /** Returns whether dev mode should be enabled. This enables e.g. the dev menu. */
  public abstract boolean getUseDeveloperSupport();

  /** Get the {@link DevSupportManagerFactory}. Override this to use a custom dev support manager */
  protected @Nullable DevSupportManagerFactory getDevSupportManagerFactory() {
    return null;
  }

  /**
   * Returns a list of {@link ReactPackage} used by the app. You'll most likely want to return at
   * least the {@code MainReactPackage}. If your app uses additional views or modules besides the
   * default ones, you'll want to include more packages here.
   */
  protected abstract List<ReactPackage> getPackages();

  /**
   * Returns the {@link JSEngineResolutionAlgorithm} to be used when loading the JS engine. If null,
   * will try to load JSC first and fallback to Hermes if JSC is not available.
   */
  protected @Nullable JSEngineResolutionAlgorithm getJSEngineResolutionAlgorithm() {
    return null;
  }

  /**
   * Returns a custom implementation of ChoreographerProvider to be used this host. If null - React
   * will use default direct android.view.Choreographer-based provider.
   */
  protected @Nullable ChoreographerProvider getChoreographerProvider() {
    return null;
  }
}
