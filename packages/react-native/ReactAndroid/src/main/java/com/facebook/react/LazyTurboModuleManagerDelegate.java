/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * This abstract class provides a simple Lazy implementation of TurboModuleManagerDelegate. Main
 * difference between this class and ReactPackageTurboModuleManagerDelegate is that
 * LazyTurboModuleManagerDelegate does not require NativeModules to be annotated using a
 * ReactModule, also this class does not use the {@link
 * TurboReactPackage#getReactModuleInfoProvider} method. This class is for experimentation purposes
 * only, not to meant to be used in production.
 */
@UnstableReactNativeAPI
public abstract class LazyTurboModuleManagerDelegate
    extends ReactPackageTurboModuleManagerDelegate {

  private final List<ReactPackage> mPackages;
  private final ReactApplicationContext mReactContext;
  private final Map<String, TurboModule> mModules = new HashMap<>();

  public LazyTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    super();
    mPackages = packages;
    mReactContext = reactApplicationContext;
  }

  @Override
  @Nullable
  public TurboModule getModule(String moduleName) {
    TurboModule nativeModule = mModules.get(moduleName);
    if (nativeModule == null) {
      /**
       * Returns first TurboModule from found with the name received as a parameter. There's no
       * warning or error if there are more than one TurboModule registered with the same name in
       * different packages. This method relies on the order of insertion of ReactPackage into
       * mPackages. Usually the size of mPackages is very small (2 or 3 packages in the majority of
       * the cases)
       */
      for (ReactPackage reactPackage : mPackages) {
        if (reactPackage instanceof TurboReactPackage) {
          TurboReactPackage turboPkg = (TurboReactPackage) reactPackage;
          try {
            nativeModule = (TurboModule) turboPkg.getModule(moduleName, mReactContext);
          } catch (IllegalArgumentException ex) {
            /*
             TurboReactPackages can throw an IllegalArgumentException when a module isn't found. If
             this happens, it's safe to ignore the exception because a later TurboReactPackage could
             provide the module.
            */
          }
          if (nativeModule != null) {
            mModules.put(moduleName, nativeModule);
            nativeModule.initialize();
            return nativeModule;
          }
        } else {
          throw new IllegalArgumentException(
              "ReactPackage must be an instance of TurboReactPackage");
        }
      }
    }
    return nativeModule;
  }

  @Override
  public boolean unstable_isModuleRegistered(String moduleName) {
    return getModule(moduleName) != null;
  }

  @Override
  public boolean unstable_shouldEnableLegacyModuleInterop() {
    return false;
  }

  @Override
  public boolean unstable_shouldRouteTurboModulesThroughLegacyModuleInterop() {
    return false;
  }

  @Override
  public NativeModule getLegacyModule(String moduleName) {
    throw new UnsupportedOperationException("Legacy Modules are not supported");
  }

  @Override
  public boolean unstable_isLegacyModuleRegistered(String moduleName) {
    return false;
  };
}
