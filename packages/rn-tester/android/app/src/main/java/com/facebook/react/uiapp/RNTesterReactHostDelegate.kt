/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import android.content.Context
import com.facebook.fbreact.specs.SampleLegacyModule
import com.facebook.fbreact.specs.SampleTurboModule
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.JSEngineInstance
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.turbomodule.core.TurboModuleManager
import com.facebook.react.uiapp.component.MyLegacyViewManager
import com.facebook.react.uiapp.component.MyNativeViewManager
import com.facebook.react.uimanager.ViewManager

@UnstableReactNativeAPI
class RNTesterReactHostDelegate internal constructor(context: Context) : ReactHostDelegate {
  var reactHost: ReactHostImpl? = null

  override val jsMainModulePath: String = "js/RNTesterApp.android"

  override val jsBundleLoader: JSBundleLoader =
      JSBundleLoader.createAssetLoader(context, "assets://RNTesterApp.android.bundle", true)

  @get:Synchronized override val bindingsInstaller: BindingsInstaller? = null

  override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder =
      DefaultTurboModuleManagerDelegate.Builder()

  override val jsEngineInstance: JSEngineInstance =
      if (reactHost?.jsEngineResolutionAlgorithm == JSEngineResolutionAlgorithm.JSC) {
        JSCInstance()
      } else {
        HermesInstance()
      }

  override fun handleInstanceException(error: Exception) {}

  override fun getReactNativeConfig(turboModuleManager: TurboModuleManager): ReactNativeConfig =
      ReactNativeConfig.DEFAULT_CONFIG

  override val reactPackages: List<ReactPackage> by lazy {
    listOf(
        MainReactPackage(),
        object : TurboReactPackage() {
          override fun getModule(
              name: String,
              reactContext: ReactApplicationContext
          ): NativeModule? =
              when {
                !ReactFeatureFlags.useTurboModules -> null
                name == SampleTurboModule.NAME -> SampleTurboModule(reactContext)
                name == SampleLegacyModule.NAME -> SampleLegacyModule(reactContext)
                else -> null
              }

          // Note: Specialized annotation processor for @ReactModule isn't
          // configured in OSS
          // yet. For now, hardcode this information, though it's not necessary
          // for most modules
          override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
              ReactModuleInfoProvider {
                if (ReactFeatureFlags.useTurboModules) {
                  mapOf(
                      SampleTurboModule.NAME to
                          ReactModuleInfo(
                              SampleTurboModule.NAME,
                              "SampleTurboModule",
                              false, // canOverrideExistingModule
                              false, // needsEagerInit
                              true, // hasConstants
                              false, // isCxxModule
                              true // isTurboModule
                              ),
                      SampleLegacyModule.NAME to
                          ReactModuleInfo(
                              SampleLegacyModule.NAME,
                              "SampleLegacyModule",
                              false, // canOverrideExistingModule
                              false, // needsEagerInit
                              true, // hasConstants
                              false, // isCxxModule
                              false // isTurboModule
                              ),
                  )
                } else {
                  emptyMap()
                }
              }
        },
        object : ReactPackage {
          override fun createNativeModules(
              reactContext: ReactApplicationContext
          ): List<NativeModule> = emptyList()

          override fun createViewManagers(
              reactContext: ReactApplicationContext
          ): List<ViewManager<*, *>> =
              listOf(MyNativeViewManager(), MyLegacyViewManager(reactContext))
        })
  }
}
