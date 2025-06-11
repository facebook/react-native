/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import android.app.Application
import com.facebook.fbreact.specs.SampleLegacyModule
import com.facebook.fbreact.specs.SampleTurboModule
import com.facebook.react.BaseReactPackage
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.osslibraryexample.OSSLibraryExamplePackage
import com.facebook.react.popupmenu.PopupMenuPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.react.uiapp.component.MyLegacyViewManager
import com.facebook.react.uiapp.component.MyNativeViewManager
import com.facebook.react.uiapp.component.ReportFullyDrawnViewManager
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.facebook.soloader.SoLoader

internal class RNTesterApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost by lazy {
    object : DefaultReactNativeHost(this) {
      public override fun getJSMainModuleName(): String = BuildConfig.JS_MAIN_MODULE_NAME

      public override fun getBundleAssetName(): String = BuildConfig.BUNDLE_ASSET_NAME

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      public override fun getPackages(): List<ReactPackage> {
        return listOf(
            MainReactPackage(),
            PopupMenuPackage(),
            OSSLibraryExamplePackage(),
            object : BaseReactPackage() {
              override fun getModule(
                  name: String,
                  reactContext: ReactApplicationContext
              ): NativeModule? =
                  when {
                    SampleTurboModule.NAME == name -> SampleTurboModule(reactContext)
                    SampleLegacyModule.NAME == name -> SampleLegacyModule(reactContext)
                    else -> null
                  }

              // Note: Specialized annotation processor for @ReactModule isn't configured in OSS
              // yet. For now, hardcode this information, though it's not necessary for most
              // modules.
              override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
                  ReactModuleInfoProvider {
                    mapOf(
                        SampleTurboModule.NAME to
                            ReactModuleInfo(
                                SampleTurboModule.NAME,
                                "SampleTurboModule",
                                canOverrideExistingModule = false,
                                needsEagerInit = false,
                                isCxxModule = false,
                                isTurboModule = true),
                        SampleLegacyModule.NAME to
                            ReactModuleInfo(
                                SampleLegacyModule.NAME,
                                "SampleLegacyModule",
                                canOverrideExistingModule = false,
                                needsEagerInit = false,
                                isCxxModule = false,
                                isTurboModule = false))
                  }
            },
            object : ReactPackage, ViewManagerOnDemandReactPackage {
              override fun createNativeModules(
                  reactContext: ReactApplicationContext
              ): List<NativeModule> = emptyList()

              override fun getViewManagerNames(reactContext: ReactApplicationContext) =
                  listOf("RNTMyNativeView", "RNTMyLegacyNativeView", "RNTReportFullyDrawnView")

              override fun createViewManagers(
                  reactContext: ReactApplicationContext
              ): List<ViewManager<*, *>> =
                  listOf(
                      MyNativeViewManager(),
                      MyLegacyViewManager(reactContext),
                      ReportFullyDrawnViewManager())

              override fun createViewManager(
                  reactContext: ReactApplicationContext,
                  viewManagerName: String
              ): ViewManager<*, out ReactShadowNode<*>>? =
                  when (viewManagerName) {
                    "RNTMyNativeView" -> MyNativeViewManager()
                    "RNTMyLegacyNativeView" -> MyLegacyViewManager(reactContext)
                    "RNTReportFullyDrawnView" -> ReportFullyDrawnViewManager()
                    else -> null
                  }
            })
      }

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = true
    }
  }

  override val reactHost: ReactHost
    get() = DefaultReactHost.getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    ReactFontManager.getInstance().addCustomFont(this, "Rubik", R.font.rubik)
    super.onCreate()

    if (BuildConfig.IS_INTERNAL_BUILD) {
      // For Buck we call the simple init() as the SoMapping is built-from-source inside SoLoader
      SoLoader.init(this, false)
    } else {
      // For Gradle instead, we need to specify it as constructor parameter.
      SoLoader.init(this, OpenSourceMergedSoMapping)
    }

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}
