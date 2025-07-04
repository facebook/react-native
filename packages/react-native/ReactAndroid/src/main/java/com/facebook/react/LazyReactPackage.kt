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

/** React package supporting lazy creation of native modules. */
@Deprecated("This class is deprecated, please use BaseReactPackage instead.")
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public abstract class LazyReactPackage : ReactPackage {
  /**
   * We return an iterable
   *
   * @param reactContext context
   * @return An [Iterable]<[ModuleHolder]> that contains all native modules registered for the
   *   context
   */
  public fun getNativeModuleIterator(
      reactContext: ReactApplicationContext
  ): Iterable<ModuleHolder> {
    val reactModuleInfoMap: Map<String, ReactModuleInfo> =
        reactModuleInfoProvider.getReactModuleInfos()
    val nativeModules = getNativeModules(reactContext)

    return object : Iterable<ModuleHolder> {
      override fun iterator(): Iterator<ModuleHolder> {
        var position = 0

        return object : Iterator<ModuleHolder> {
          override fun hasNext(): Boolean = position < nativeModules.size

          override fun next(): ModuleHolder {
            val moduleSpec = nativeModules[position++]
            val name = moduleSpec.name
            val reactModuleInfo = reactModuleInfoMap[name]

            return if (reactModuleInfo == null) {
              val module: NativeModule
              ReactMarker.logMarker(
                  ReactMarkerConstants.CREATE_MODULE_START,
                  name,
              )
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
        }
      }
    }
  }

  /**
   * @param reactContext react application context that can be used to create modules
   * @return list of module specs that can create the native modules
   */
  protected abstract fun getNativeModules(reactContext: ReactApplicationContext): List<ModuleSpec>

  /**
   * Internal accessor to [getNativeModules]. This is needed because [getNativeModules] was
   * originally protected in Java (which had subclass + package visibility) and is now protected in
   * Kotlin (which has only subclass visiblity). We add this accessor to prevent making
   * [getNativeModules] public
   */
  internal fun internal_getNativeModules(reactContext: ReactApplicationContext): List<ModuleSpec> =
      getNativeModules(reactContext)

  /**
   * @param reactContext react application context that can be used to create modules
   * @return A [List]<[NativeModule]> to register
   */
  @Suppress("DEPRECATION")
  @Deprecated("Migrate to [BaseReactPackage] and implement [getModule] instead.")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
      buildList {
        for (holder in getNativeModules(reactContext)) {
          val nativeModule: NativeModule
          SystraceMessage.beginSection(TRACE_TAG_REACT, "createNativeModule").flush()
          ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, holder.name)
          try {
            nativeModule = holder.provider.get()
          } finally {
            ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END)
            SystraceMessage.endSection(TRACE_TAG_REACT).flush()
          }
          add(nativeModule)
        }
      }

  /**
   * @param reactContext react application context that can be used to create View Managers.
   * @return list of module specs that can create the View Managers.
   */
  public open fun getViewManagers(reactContext: ReactApplicationContext): List<ModuleSpec> =
      emptyList()

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<in Nothing, in Nothing>> {
    val viewManagerModuleSpecs = getViewManagers(reactContext)
    if (viewManagerModuleSpecs.isEmpty()) {
      return emptyList()
    }

    val viewManagers: List<ViewManager<in Nothing, in Nothing>> = buildList {
      for (moduleSpec in viewManagerModuleSpecs) {
        add(moduleSpec.provider.get() as ViewManager<in Nothing, in Nothing>)
      }
    }
    return viewManagers
  }

  public abstract val reactModuleInfoProvider: ReactModuleInfoProvider

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "LazyReactPackage",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
