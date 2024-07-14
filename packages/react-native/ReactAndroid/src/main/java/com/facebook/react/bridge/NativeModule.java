/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.common.annotations.StableReactNativeAPI;
import javax.annotation.Nonnull;

/*
 * IMPORTANT: Do not migrate this interface to Kotlin as you'll create a breaking change for React Native
 * libraries written in Kotlin.
 */

/**
 * A native module whose API can be provided to JS catalyst instances. {@link NativeModule}s whose
 * implementation is written in Java should extend {@link BaseJavaModule} or {@link
 * ReactContextBaseJavaModule}. {@link NativeModule}s whose implementation is written in C++ must
 * not provide any Java code (so they can be reused on other platforms), and instead should register
 * themselves using {@link CxxModuleWrapper}.
 */
@StableReactNativeAPI
@DoNotStrip
public interface NativeModule {

  /**
   * @return the name of this module. This will be the name used to {@code require()} this module
   *     from javascript.
   */
  // IMPORTANT: Do not migrate this interface to Kotlin as you'll create a breaking change
  // for React Native libraries written in Kotlin
  @Nonnull
  String getName();

  /** This method is called after {@link ReactApplicationContext} has been created. */
  void initialize();

  /** Allow NativeModule to clean up. Called before React Native instance is destroyed. */
  void invalidate();

  /**
   * Return true if you intend to override some other native module that was registered e.g. as part
   * of a different package (such as the core one). Trying to override without returning true from
   * this method is considered an error and will throw an exception during initialization. By
   * default all modules return false.
   */
  @DeprecatedInNewArchitecture()
  default boolean canOverrideExistingModule() {
    return false;
  }

  /**
   * Allow NativeModule to clean up. Called before {CatalystInstance#onHostDestroy}
   *
   * @deprecated use {@link #invalidate()} instead.
   */
  @Deprecated(since = "Use invalidate method instead", forRemoval = true)
  default void onCatalystInstanceDestroy() {}
}
