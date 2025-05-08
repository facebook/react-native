/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.module.annotations.ReactModule;
import javax.inject.Provider;

/**
 * A specification for a native module. This exists so that we don't have to pay the cost for
 * creation until/if the module is used.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ModuleSpec {

  private static final String TAG = "ModuleSpec";
  private final Provider<? extends NativeModule> mProvider;
  private final @Nullable String mName;

  public static ModuleSpec viewManagerSpec(Provider<? extends NativeModule> provider) {
    return new ModuleSpec(provider);
  }

  public static ModuleSpec nativeModuleSpec(
      Class<? extends NativeModule> type, Provider<? extends NativeModule> provider) {
    ReactModule annotation = type.getAnnotation(ReactModule.class);
    if (annotation == null) {
      FLog.w(
          TAG,
          "Could not find @ReactModule annotation on "
              + type.getName()
              + ". So creating the module eagerly to get the name. Consider adding an annotation to"
              + " make this Lazy");
      NativeModule nativeModule = provider.get();
      return new ModuleSpec(provider, nativeModule.getName());
    } else {
      return new ModuleSpec(provider, annotation.name());
    }
  }

  public static ModuleSpec nativeModuleSpec(
      String className, Provider<? extends NativeModule> provider) {
    return new ModuleSpec(provider, className);
  }

  /**
   * Called by View Managers
   *
   * @param provider
   */
  private ModuleSpec(Provider<? extends NativeModule> provider) {
    mProvider = provider;
    mName = null;
  }

  private ModuleSpec(Provider<? extends NativeModule> provider, String name) {
    mProvider = provider;
    mName = name;
  }

  public @Nullable String getName() {
    return mName;
  }

  public Provider<? extends NativeModule> getProvider() {
    return mProvider;
  }
}
