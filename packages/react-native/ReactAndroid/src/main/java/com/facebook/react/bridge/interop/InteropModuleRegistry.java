/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.interop;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.config.ReactFeatureFlags;
import java.util.HashMap;

/**
 * A utility class that takes care of returning {@link JavaScriptModule} which are used for the
 * Fabric Interop Layer. This allows us to override the returned classes once the user is invoking
 * `ReactContext.getJsModule()`.
 *
 * <p>Currently we only support a `RCTEventEmitter` re-implementation, being `InteropEventEmitter`
 * but this class can support other re-implementation in the future.
 */
public class InteropModuleRegistry {

  @SuppressWarnings("rawtypes")
  private final HashMap<Class, Object> supportedModules;

  public InteropModuleRegistry() {
    supportedModules = new HashMap<>();
  }

  public <T extends JavaScriptModule> boolean shouldReturnInteropModule(Class<T> requestedModule) {
    return checkReactFeatureFlagsConditions() && supportedModules.containsKey(requestedModule);
  }

  @Nullable
  public <T extends JavaScriptModule> T getInteropModule(Class<T> requestedModule) {
    if (checkReactFeatureFlagsConditions()) {
      //noinspection unchecked
      return (T) supportedModules.get(requestedModule);
    } else {
      return null;
    }
  }

  public <T extends JavaScriptModule> void registerInteropModule(
      Class<T> interopModuleInterface, Object interopModule) {
    if (checkReactFeatureFlagsConditions()) {
      supportedModules.put(interopModuleInterface, interopModule);
    }
  }

  private boolean checkReactFeatureFlagsConditions() {
    return ReactFeatureFlags.enableFabricRenderer && ReactFeatureFlags.unstable_useFabricInterop;
  }
}
