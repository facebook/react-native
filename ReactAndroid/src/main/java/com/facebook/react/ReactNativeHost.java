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

import java.util.List;

import android.app.Application;

import com.facebook.infer.annotation.Assertions;

/**
 * Simple class that holds an instance of {@link ReactInstanceManager}. This can be used in your
 * {@link Application class} (see {@link ReactApplication}), or as a static field.
 */
public abstract class ReactNativeHost {

  private final Application mApplication;
  private @Nullable ReactInstanceManager mReactInstanceManager;

  protected ReactNativeHost(Application application) {
    mApplication = application;
  }

  /**
   * Get the current {@link ReactInstanceManager} instance, or create one.
   */
  public ReactInstanceManager getReactInstanceManager() {
    if (mReactInstanceManager == null) {
      mReactInstanceManager = createReactInstanceManager();
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
    ReactInstanceManager.Builder builder = ReactInstanceManager.builder()
      .setApplication(mApplication)
      .setJSMainModuleName(getJSMainModuleName())
      .setUseDeveloperSupport(getUseDeveloperSupport())
      .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    for (ReactPackage reactPackage : getPackages()) {
      builder.addPackage(reactPackage);
    }

    String jsBundleFile = getJSBundleFile();
    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile);
    } else {
      builder.setBundleAssetName(Assertions.assertNotNull(getBundleAssetName()));
    }

    return builder.build();
  }

  /**
   * Returns the name of the main module. Determines the URL used to fetch the JS bundle
   * from the packager server. It is only used when dev support is enabled.
   * This is the first file to be executed once the {@link ReactInstanceManager} is created.
   * e.g. "index.android"
   */
  protected String getJSMainModuleName() {
    return "index.android";
  }

  /**
   * Returns a custom path of the bundle file. This is used in cases the bundle should be loaded
   * from a custom path. By default it is loaded from Android assets, from a path specified
   * by {@link getBundleAssetName}.
   * e.g. "file://sdcard/myapp_cache/index.android.bundle"
   */
  protected @Nullable String getJSBundleFile() {
    return null;
  }

  /**
   * Returns the name of the bundle in assets. If this is null, and no file path is specified for
   * the bundle, the app will only work with {@code getUseDeveloperSupport} enabled and will
   * always try to load the JS bundle from the packager server.
   * e.g. "index.android.bundle"
   */
  protected @Nullable String getBundleAssetName() {
    return "index.android.bundle";
  }

  /**
   * Returns whether dev mode should be enabled. This enables e.g. the dev menu.
   */
  protected abstract boolean getUseDeveloperSupport();

  /**
   * Returns a list of {@link ReactPackage} used by the app.
   * You'll most likely want to return at least the {@code MainReactPackage}.
   * If your app uses additional views or modules besides the default ones,
   * you'll want to include more packages here.
   */
  protected abstract List<ReactPackage> getPackages();
}
