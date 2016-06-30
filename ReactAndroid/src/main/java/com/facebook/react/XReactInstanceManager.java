/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.UIImplementationProvider;

public abstract class XReactInstanceManager {
  /**
   * Creates a builder that is capable of creating an instance of {@link XReactInstanceManagerImpl}.
   */
  public static Builder builder() {
    return new Builder();
  }

  /**
   * Builder class for {@link XReactInstanceManagerImpl}
   */
  public static class Builder extends ReactInstanceManager.Builder {
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
    }
  }
}
