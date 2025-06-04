/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.bridge.ReactMarker.logMarker
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger.assertLegacyArchitecture
import com.facebook.react.module.annotations.ReactModule
import com.facebook.systrace.Systrace
import com.facebook.systrace.Systrace.beginSection
import com.facebook.systrace.Systrace.endSection

/** A set of Java APIs to expose to a particular JavaScript instance. */
@LegacyArchitecture
public class NativeModuleRegistry(
    private val reactApplicationContext: ReactApplicationContext,
    private val modules: MutableMap<String, ModuleHolder>
) {
  /** Private getters for combining NativeModuleRegistry's */
  private val moduleMap: Map<String, ModuleHolder>
    get() = modules

  @JvmName("getJavaModules") // This is needed because this method is accessed by JNI
  internal fun getJavaModules(jsInstance: JSInstance): List<JavaModuleWrapper> = buildList {
    for ((_, value) in modules) {
      if (!value.isCxxModule) {
        add(JavaModuleWrapper(jsInstance, value))
      }
    }
  }

  @get:JvmName(
      "getCxxModules") // This is needed till there are Java Consumer of this API inside React
  // Native
  internal val cxxModules: List<ModuleHolder>
    get() = buildList {
      for ((_, value) in modules) {
        if (value.isCxxModule) {
          add(value)
        }
      }
    }

  /** Adds any new modules to the current module registry */
  @JvmName(
      "registerModules") // This is needed till there are Java Consumer of this API inside React
  // Native
  internal fun registerModules(newRegister: NativeModuleRegistry) {
    check(reactApplicationContext == newRegister.reactApplicationContext) {
      "Extending native modules with non-matching application contexts."
    }

    val newModules = newRegister.moduleMap

    for ((key, value) in newModules) {
      if (!modules.containsKey(key)) {
        modules[key] = value
      }
    }
  }

  @JvmName(
      "notifyJSInstanceDestroy") // This is needed till there are Java Consumer of this API inside
  // React Native
  internal fun notifyJSInstanceDestroy() {
    reactApplicationContext.assertOnNativeModulesQueueThread()
    beginSection(Systrace.TRACE_TAG_REACT, "NativeModuleRegistry_notifyJSInstanceDestroy")
    try {
      for (module in modules.values) {
        module.destroy()
      }
    } finally {
      endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  @JvmName("notifyJSInstanceInitialized") // This is needed till there are Java Consumer of this API
  // inside React Native
  internal fun notifyJSInstanceInitialized() {
    reactApplicationContext.assertOnNativeModulesQueueThread(
        "From version React Native v0.44, " +
            "native modules are explicitly not initialized on the UI thread.")
    logMarker(ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_START)
    beginSection(Systrace.TRACE_TAG_REACT, "NativeModuleRegistry_notifyJSInstanceInitialized")
    try {
      for (module in modules.values) {
        module.markInitializable()
      }
    } finally {
      endSection(Systrace.TRACE_TAG_REACT)
      logMarker(ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_END)
    }
  }

  public fun onBatchComplete() {
    // The only native module that uses the onBatchComplete is the UI Manager. Hence, instead of
    // iterating over all the modules for find this one instance, and then calling it, we
    // short-circuit
    // the search, and simply call OnBatchComplete on the UI Manager.
    // With Fabric, UIManager would no longer be a NativeModule, so this call would simply go away
    assertLegacyArchitecture(
        "NativeModuleRegistry.onBatchComplete()", LegacyArchitectureLogLevel.WARNING)
    modules["UIManager"]?.let {
      if (it.hasInstance()) {
        (it.module as OnBatchCompleteListener).onBatchComplete()
      }
    }
  }

  public fun <T : NativeModule> hasModule(moduleInterface: Class<T>): Boolean {
    val annotation = moduleInterface.getAnnotation(ReactModule::class.java)
    requireNotNull(annotation) {
      "Could not find @ReactModule annotation in class " + moduleInterface.name
    }
    val name = annotation.name
    return modules.containsKey(name)
  }

  public fun <T : NativeModule> getModule(moduleInterface: Class<T>): T {
    val annotation = moduleInterface.getAnnotation(ReactModule::class.java)
    requireNotNull(annotation) {
      "Could not find @ReactModule annotation in class " + moduleInterface.name
    }
    @Suppress("UNCHECKED_CAST")
    return checkNotNull(modules[annotation.name]) {
          "$annotation.name could not be found. Is it defined in ${moduleInterface.name}"
        }
        .module as T
  }

  public fun hasModule(name: String): Boolean = modules.containsKey(name)

  public fun getModule(name: String): NativeModule =
      checkNotNull(modules[name]) { "Could not find module with name $name" }.module

  public val allModules: List<NativeModule>
    get() = buildList {
      for (module in modules.values) {
        add(module.module)
      }
    }
}
