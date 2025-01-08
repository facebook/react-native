/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.app.Application
import android.content.Context
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManagerProvider
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.FabricUIManagerProviderImpl
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.ViewManagerResolver

/**
 * A utility class that allows you to simplify the setup of a [ReactNativeHost] for new apps in Open
 * Source.
 *
 * Specifically, for apps that are using the New Architecture, this Default class takes care of
 * providing the default TurboModuleManagerDelegateBuilder and the default JSIModulePackage,
 * provided the name of the dynamic library to load.
 */
public abstract class DefaultReactNativeHost
protected constructor(
    application: Application,
) : ReactNativeHost(application) {

  override fun getReactPackageTurboModuleManagerDelegateBuilder():
      ReactPackageTurboModuleManagerDelegate.Builder? =
      if (isNewArchEnabled) {
        DefaultTurboModuleManagerDelegate.Builder()
      } else {
        null
      }

  override fun getUIManagerProvider(): UIManagerProvider? =
      if (isNewArchEnabled) {
        UIManagerProvider { reactApplicationContext: ReactApplicationContext ->
          val componentFactory = ComponentFactory()
          DefaultComponentsRegistry.register(componentFactory)

          val viewManagerRegistry =
              if (lazyViewManagersEnabled) {
                ViewManagerRegistry(
                    object : ViewManagerResolver {
                      override fun getViewManager(viewManagerName: String) =
                          reactInstanceManager.createViewManager(viewManagerName)

                      override fun getViewManagerNames() = reactInstanceManager.viewManagerNames
                    })
              } else {
                ViewManagerRegistry(
                    reactInstanceManager.getOrCreateViewManagers(reactApplicationContext))
              }

          FabricUIManagerProviderImpl(componentFactory, viewManagerRegistry)
              .createUIManager(reactApplicationContext)
        }
      } else {
        null
      }

  override fun getJSEngineResolutionAlgorithm(): JSEngineResolutionAlgorithm? =
      when (isHermesEnabled) {
        true -> JSEngineResolutionAlgorithm.HERMES
        false -> JSEngineResolutionAlgorithm.JSC
        null -> null
      }

  /**
   * Returns whether the user wants to use the New Architecture or not.
   *
   * If true, we will load the default JSI Module Package and TurboModuleManagerDelegate needed to
   * enable the New Architecture
   *
   * If false, the app will not attempt to load the New Architecture modules.
   */
  protected open val isNewArchEnabled: Boolean
    get() = false

  /**
   * Returns whether the user wants to use Hermes.
   *
   * If true, the app will load the Hermes engine, and fail if not found. If false, the app will
   * load the JSC engine, and fail if not found. If null, the app will attempt to load JSC first and
   * fallback to Hermes if not found.
   */
  protected open val isHermesEnabled: Boolean?
    get() = null

  /**
   * Converts this [ReactNativeHost] (bridge-mode) to a [ReactHost] (bridgeless-mode).
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   */
  @UnstableReactNativeAPI
  internal fun toReactHost(context: Context): ReactHost =
      DefaultReactHost.getDefaultReactHost(
          context,
          packages,
          jsMainModuleName,
          bundleAssetName ?: "index",
          jsBundleFile,
          isHermesEnabled ?: true,
          useDeveloperSupport,
      )
}
