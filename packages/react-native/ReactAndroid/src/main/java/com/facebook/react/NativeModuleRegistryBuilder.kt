/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react

import com.facebook.react.bridge.ModuleHolder
import com.facebook.react.bridge.NativeModuleRegistry
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/** Helper class to build NativeModuleRegistry. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
public class NativeModuleRegistryBuilder(
    private val reactApplicationContext: ReactApplicationContext,
) {

  private val modules = HashMap<String, ModuleHolder>()

  @Deprecated(
      "ReactInstanceManager is not used",
      ReplaceWith("NativeModuleRegistryBuilder(reactApplicationContext)"),
  )
  public constructor(
      reactApplicationContext: ReactApplicationContext,
      @Suppress("UNUSED_PARAMETER") reactInstanceManager: ReactInstanceManager,
  ) : this(reactApplicationContext)

  public fun processPackage(reactPackage: ReactPackage) {
    // We use an iterable instead of an iterator here to ensure thread safety, and that this list
    // cannot be modified
    val moduleHolders =
        @Suppress("DEPRECATION")
        if (reactPackage is LazyReactPackage) {
          reactPackage.getNativeModuleIterator(reactApplicationContext)
        } else if (reactPackage is BaseReactPackage) {
          reactPackage.getNativeModuleIterator(reactApplicationContext)
        } else {
          ReactPackageHelper.getNativeModuleIterator(reactPackage, reactApplicationContext)
        }
    for (moduleHolder in moduleHolders) {
      val name = moduleHolder.name
      val existingNativeModule = modules[name]
      if (existingNativeModule != null) {
        check(moduleHolder.canOverrideExistingModule) {
          """
Native module $name tried to override ${existingNativeModule.className}.

Check the getPackages() method in MainApplication.java, it might be that module is being created twice.
If this was your intention, set canOverrideExistingModule=true. This error may also be present if the
package is present only once in getPackages() but is also automatically added later during build time
by autolinking. Try removing the existing entry and rebuild.
"""
        }
      }
      modules[name] = moduleHolder
    }
  }

  public fun build(): NativeModuleRegistry = NativeModuleRegistry(reactApplicationContext, modules)

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "NativeModuleRegistryBuilder",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
