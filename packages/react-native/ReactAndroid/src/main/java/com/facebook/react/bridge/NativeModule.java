/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;
import javax.annotation.Nonnull;

/**
 * A native module whose API can be provided to JS catalyst instances. {@link NativeModule}s whose
 * implementation is written in Java should extend {@link BaseJavaModule} or {@link
 * ReactContextBaseJavaModule}. {@link NativeModule}s whose implementation is written in C++ must
 * not provide any Java code (so they can be reused on other platforms), and instead should register
 * themselves using {@link CxxModuleWrapper}.
 */
@DoNotStrip
public interface NativeModule {
  interface NativeMethod {
    void invoke(JSInstance jsInstance, ReadableArray parameters);

    String getType();
  }

  /**
   * @return the name of this module. This will be the name used to {@code require()} this module
   *     from javascript.
   */
  @Nonnull
  String getName();

  /**
   * This is called at the end of {@link CatalystApplicationFragment#createCatalystInstance()} after
   * the CatalystInstance has been created, in order to initialize NativeModules that require the
   * CatalystInstance or JS modules.
   */
  void initialize();

  /**
   * Return true if you intend to override some other native module that was registered e.g. as part
   * of a different package (such as the core one). Trying to override without returning true from
   * this method is considered an error and will throw an exception during initialization. By
   * default all modules return false.
   */
  boolean canOverrideExistingModule();

  /**
   * Allow NativeModule to clean up. Called before {CatalystInstance#onHostDestroy}
   *
   * @deprecated use {@link #invalidate()} instead.
   */
  void onCatalystInstanceDestroy();

  /** Allow NativeModule to clean up. Called before {CatalystInstance#onHostDestroy} */
  void invalidate();
}
