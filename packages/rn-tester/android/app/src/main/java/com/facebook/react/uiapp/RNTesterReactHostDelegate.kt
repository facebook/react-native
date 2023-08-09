/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uiapp

import android.content.Context
import com.facebook.fbreact.specs.SampleTurboModule
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridgeless.BindingsInstaller
import com.facebook.react.bridgeless.JSCInstance
import com.facebook.react.bridgeless.JSEngineInstance
import com.facebook.react.bridgeless.ReactHost
import com.facebook.react.bridgeless.ReactHostDelegate
import com.facebook.react.bridgeless.hermes.HermesInstance
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.turbomodule.core.TurboModuleManager
import com.facebook.react.uiapp.component.MyLegacyViewManager
import com.facebook.react.uiapp.component.MyNativeViewManager
import com.facebook.react.uimanager.ViewManager
import java.util.Arrays

@UnstableReactNativeAPI
class RNTesterReactHostDelegate internal constructor(private val mContext: Context) :
  ReactHostDelegate {
  private var mReactHost: ReactHost? = null
  private var mReactPackages: List<ReactPackage> = emptyList()

  fun setReactHost(reactHost: ReactHost?) {
    mReactHost = reactHost
  }

  override val jSMainModulePath: String
    get() = "js/RNTesterApp.android"

  override val jSBundleLoader: JSBundleLoader
    get() =
      JSBundleLoader.createAssetLoader(mContext, "assets://RNTesterApp.android.bundle", true)

  @get:Synchronized
  override val bindingsInstaller: BindingsInstaller?
    get() = null

  override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder
    get() = DefaultTurboModuleManagerDelegate.Builder()

  override val jSEngineInstance: JSEngineInstance
    get() =
      if (mReactHost!!.jsEngineResolutionAlgorithm == JSEngineResolutionAlgorithm.JSC) {
        JSCInstance()
      } else {
        HermesInstance()
      }

  override fun handleInstanceException(e: Exception) {}

  override fun getReactNativeConfig(turboModuleManager: TurboModuleManager): ReactNativeConfig {
    return ReactNativeConfig.DEFAULT_CONFIG
  }

  override val reactPackages: List<ReactPackage>
    get() {
      if (mReactPackages == null) {
        mReactPackages =
          Arrays.asList(
            MainReactPackage(),
            object : TurboReactPackage() {
              override fun getModule(
                name: String,
                reactContext: ReactApplicationContext
              ): NativeModule? {
                if (!ReactFeatureFlags.useTurboModules) {
                  return null
                }
                return if (SampleTurboModule.NAME == name) {
                  SampleTurboModule(reactContext)
                } else null
              }

              // Note: Specialized annotation processor for @ReactModule isn't
              // configured in OSS
              // yet. For now, hardcode this information, though it's not necessary
              // for most
              // modules.
              override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
                return ReactModuleInfoProvider {
                  val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
                  if (ReactFeatureFlags.useTurboModules) {
                    moduleInfos[SampleTurboModule.NAME] =
                      ReactModuleInfo(
                        SampleTurboModule.NAME,
                        "SampleTurboModule",
                        false, // canOverrideExistingModule
                        false, // needsEagerInit
                        true, // hasConstants
                        false, // isCxxModule
                        true // isTurboModule
                      )
                  }
                  moduleInfos
                }
              }
            },
            object : ReactPackage {
              override fun createNativeModules(
                reactContext: ReactApplicationContext
              ): List<NativeModule> {
                return emptyList()
              }

              override fun createViewManagers(
                reactContext: ReactApplicationContext
              ): List<ViewManager<*, *>> {
                val viewManagers: MutableList<ViewManager<*, *>> = ArrayList()
                viewManagers.add(MyNativeViewManager())
                viewManagers.add(MyLegacyViewManager(reactContext))
                return viewManagers
              }
            }
          )
      }
      return mReactPackages
    }
}
