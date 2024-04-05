/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture
import com.facebook.react.common.annotations.StableReactNativeAPI

/**
 * A native module whose API can be provided to JS catalyst instances. [NativeModule]s whose
 * implementation is written in Kotlin should extend [BaseJavaModule] or
 * [ReactContextBaseJavaModule]. [NativeModule]s whose implementation is written in C++ must not
 * provide any Kotlin code (so they can be reused on other platforms), and instead should register
 * themselves using [CxxModuleWrapper].
 */
@StableReactNativeAPI
@DoNotStrip
public interface NativeModule {

  /**
   * @return the name of this module. This will be the name used to `require()` this module from
   *   javascript.
   */
  public fun getName(): String

  /** This method is called after [ReactApplicationContext] has been created. */
  public fun initialize(): Unit

  /** Allow NativeModule to clean up. Called before React Native instance is destroyed. */
  public fun invalidate(): Unit

  /**
   * Return true if you intend to override some other native module that was registered e.g. as part
   * of a different package (such as the core one). Trying to override without returning true from
   * this method is considered an error and will throw an exception during initialization. By
   * default all modules return false.
   */
  @DeprecatedInNewArchitecture() public fun canOverrideExistingModule(): Boolean = false

  /**
   * Allow NativeModule to clean up. Called before [CatalystInstance.onHostDestroy]
   *
   * @deprecated use [NativeModule.invalidate()] instead.
   */
  @Deprecated(
      "Use invalidate method instead",
      replaceWith = ReplaceWith("invalidate()"),
      level = DeprecationLevel.WARNING)
  public fun onCatalystInstanceDestroy(): Unit = Unit
}
