/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.common.logging.FLog
import com.facebook.react.module.annotations.ReactModule
import javax.inject.Provider

/**
 * A specification for a native module. This exists so that we don't have to pay the cost for
 * creation until/if the module is used.
 */
public class ModuleSpec
private constructor(
    @get:JvmName("provider") public val provider: Provider<out NativeModule>,
    @get:JvmName("moduleName") public val name: String? = null,
) {
  public fun getProvider(): Provider<out NativeModule> = provider

  public fun getName(): String? = name

  public companion object {
    private const val TAG: String = "ModuleSpec"

    @JvmStatic
    public fun viewManagerSpec(provider: Provider<out NativeModule>): ModuleSpec =
        ModuleSpec(provider)

    @JvmStatic
    public fun nativeModuleSpec(
        type: Class<out NativeModule>,
        provider: Provider<out NativeModule>,
    ): ModuleSpec {
      val annotation: ReactModule? = type.getAnnotation(ReactModule::class.java)

      return if (annotation == null) {
        FLog.w(
            TAG,
            "Could not find @ReactModule annotation on ${type.name}. " +
                "Creating the module eagerly to get the name. Consider adding the annotation.",
        )
        val nativeModule: NativeModule = provider.get()
        ModuleSpec(provider, nativeModule.name)
      } else {
        ModuleSpec(provider, annotation.name)
      }
    }

    @JvmStatic
    public fun nativeModuleSpec(
        className: String,
        provider: Provider<out NativeModule>,
    ): ModuleSpec = ModuleSpec(provider, className)
  }
}
