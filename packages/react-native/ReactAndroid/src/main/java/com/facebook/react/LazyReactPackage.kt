/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.ModuleHolder
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.facebook.systrace.Systrace.TRACE_TAG_REACT
import com.facebook.systrace.SystraceMessage
import java.util.ArrayList

/** React package supporting lazy creation of native modules.  */
@Deprecated("This class is deprecated, please use BaseReactPackage instead.")
@LegacyArchitecture
public abstract class LazyReactPackage : ReactPackage {
  /**
   * @param reactContext context
   * @return [Iterable<ModuleHolder>] that contains all native modules registered for the
   * context.
   */
  public fun getNativeModuleIterator(reactContext: ReactApplicationContext): Iterable<ModuleHolder> {
    val reactModuleInfoMap: Map<String, ReactModuleInfo> =
        getReactModuleInfoProvider().getReactModuleInfos()
    val nativeModules = getNativeModules(reactContext)

    return Iterable {
      object : MutableIterator<ModuleHolder> {
        var position: Int = 0

        override fun next(): ModuleHolder {
          val moduleSpec = nativeModules[position++]
          val name = moduleSpec.name
          val reactModuleInfo = reactModuleInfoMap[name]

          return if (reactModuleInfo == null) {
            val module: NativeModule
            ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, name)
            try {
              module = moduleSpec.provider.get()
            } finally {
              ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END)
            }
            ModuleHolder(module)
          } else {
            ModuleHolder(reactModuleInfo, moduleSpec.provider)
          }
        }

        override fun hasNext(): Boolean = position < nativeModules.size

        override fun remove() =
          throw UnsupportedOperationException("Cannot remove native modules from the list")
      }
    }
  }

  /**
   * @param reactContext react application context that can be used to create modules
   * @return list of module specs that can create the native modules
   */
  public abstract fun getNativeModules(reactContext: ReactApplicationContext): List<ModuleSpec>

  /**
   * @param reactContext react application context that can be used to create modules
   * @return [List<NativeModule>] to register
   */
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    val modules: MutableList<NativeModule> = ArrayList()
    for (holder in getNativeModules(reactContext)) {
      var nativeModule: NativeModule
      SystraceMessage.beginSection(TRACE_TAG_REACT, "createNativeModule").flush()
      ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, holder.getName())
      try {
        nativeModule = holder.getProvider().get()
      } finally {
        ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END)
        SystraceMessage.endSection(TRACE_TAG_REACT).flush()
      }
      modules.add(nativeModule)
    }
    return modules
  }

  /**
   * @param reactContext react application context that can be used to create View Managers.
   * @return list of module specs that can create the View Managers.
   */
  public fun getViewManagers(reactContext: ReactApplicationContext): List<ModuleSpec> = emptyList()

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    val viewManagerModuleSpecs = getViewManagers(reactContext)
    if (viewManagerModuleSpecs.isNullOrEmpty()) {
      return emptyList()
    }

    val viewManagers: MutableList<ViewManager<*, *>> = ArrayList()
    for (moduleSpec in viewManagerModuleSpecs) {
      viewManagers.add(moduleSpec.getProvider().get() as ViewManager<*, *>)
    }
    return viewManagers
  }

  public abstract fun getReactModuleInfoProvider(): ReactModuleInfoProvider

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
        "LazyReactPackage", LegacyArchitectureLogLevel.WARNING
      )
    }
  }
}
