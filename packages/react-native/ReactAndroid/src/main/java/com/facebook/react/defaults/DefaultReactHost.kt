/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.cxxreactpackage.CxxReactPackage
import com.facebook.react.runtime.hermes.HermesInstance
import java.lang.Exception

/**
 * A utility class that allows you to simplify the setup of a [ReactHost] for new apps in Open
 * Source.
 *
 * [ReactHost] is an interface responsible of handling the lifecycle of a React Native app when
 * running in bridgeless mode.
 */
public object DefaultReactHost {
  private var reactHost: ReactHost? = null

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param packageList the list of [ReactPackage]s to use for creating the [ReactHost]
   * @param jsMainModulePath the path to your app's main module on Metro. Usually `index` or
   *   `index.<platform>`
   * @param jsBundleAssetPath the path to the JS bundle relative to the assets directory. Will be
   *   composed in a `asset://...` URL
   * @param jsBundleFilePath the path to the JS bundle on the filesystem. Will be composed in a
   *   `file://...` URL
   * @param isHermesEnabled whether to use Hermes as the JS engine, default to true.
   * @param useDevSupport whether to enable dev support, default to ReactBuildConfig.DEBUG.
   * @param cxxReactPackageProviders a list of cxxreactpackage providers (to register c++ turbo
   *   modules)
   *
   * TODO(T186951312): Should this be @UnstableReactNativeAPI?
   */
  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      packageList: List<ReactPackage>,
      jsMainModulePath: String = "index",
      jsBundleAssetPath: String = "index",
      jsBundleFilePath: String? = null,
      isHermesEnabled: Boolean = true,
      useDevSupport: Boolean = ReactBuildConfig.DEBUG,
      cxxReactPackageProviders: List<(ReactContext) -> CxxReactPackage> = emptyList(),
  ): ReactHost =
      getDefaultReactHost(
          context,
          packageList,
          jsMainModulePath,
          jsBundleAssetPath,
          jsBundleFilePath,
          isHermesEnabled,
          useDevSupport,
          cxxReactPackageProviders,
          { throw it },
          null)

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param packageList the list of [ReactPackage]s to use for creating the [ReactHost]
   * @param jsMainModulePath the path to your app's main module on Metro. Usually `index` or
   *   `index.<platform>`
   * @param jsBundleAssetPath the path to the JS bundle relative to the assets directory. Will be
   *   composed in a `asset://...` URL
   * @param jsBundleFilePath the path to the JS bundle on the filesystem. Will be composed in a
   *   `file://...` URL
   * @param isHermesEnabled whether to use Hermes as the JS engine, default to true.
   * @param useDevSupport whether to enable dev support, default to ReactBuildConfig.DEBUG.
   * @param cxxReactPackageProviders a list of cxxreactpackage providers (to register c++ turbo
   *   modules)
   * @param exceptionHandler Callback that can be used by React Native host applications to react to
   *   exceptions thrown by the internals of React Native.
   * @param bindingsInstaller that can be used for installing bindings.
   *
   * TODO(T186951312): Should this be @UnstableReactNativeAPI?
   */
  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      packageList: List<ReactPackage>,
      jsMainModulePath: String = "index",
      jsBundleAssetPath: String = "index",
      jsBundleFilePath: String? = null,
      isHermesEnabled: Boolean = true,
      useDevSupport: Boolean = ReactBuildConfig.DEBUG,
      cxxReactPackageProviders: List<(ReactContext) -> CxxReactPackage> = emptyList(),
      exceptionHandler: (Exception) -> Unit = { throw it },
      bindingsInstaller: BindingsInstaller? = null,
  ): ReactHost {
    if (reactHost == null) {

      val bundleLoader =
          if (jsBundleFilePath != null) {
            if (jsBundleFilePath.startsWith("assets://")) {
              JSBundleLoader.createAssetLoader(context, jsBundleFilePath, true)
            } else {
              JSBundleLoader.createFileLoader(jsBundleFilePath)
            }
          } else {
            JSBundleLoader.createAssetLoader(context, "assets://$jsBundleAssetPath", true)
          }
      val jsRuntimeFactory = if (isHermesEnabled) HermesInstance() else JSCInstance()
      val defaultTmmDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder()
      cxxReactPackageProviders.forEach { defaultTmmDelegateBuilder.addCxxReactPackage(it) }
      val defaultReactHostDelegate =
          DefaultReactHostDelegate(
              jsMainModulePath = jsMainModulePath,
              jsBundleLoader = bundleLoader,
              reactPackages = packageList,
              jsRuntimeFactory = jsRuntimeFactory,
              bindingsInstaller = bindingsInstaller,
              turboModuleManagerDelegateBuilder = defaultTmmDelegateBuilder,
              exceptionHandler = exceptionHandler)
      val componentFactory = ComponentFactory()
      DefaultComponentsRegistry.register(componentFactory)
      // TODO: T164788699 find alternative of accessing ReactHostImpl for initialising reactHost
      reactHost =
          ReactHostImpl(
              context,
              defaultReactHostDelegate,
              componentFactory,
              true /* allowPackagerServerAccess */,
              useDevSupport,
          )
    }
    return reactHost as ReactHost
  }

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * This method takes in input a [ReactNativeHost] (bridge-mode) and uses its configuration to
   * create an equivalent [ReactHost] (bridgeless-mode).
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param reactNativeHost the [ReactNativeHost] to use for creating the [ReactHost]
   *
   * TODO(T186951312): Should this be @UnstableReactNativeAPI? It's not, to maintain consistency
   *   with above getDefaultReactHost.
   */
  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      reactNativeHost: ReactNativeHost,
  ): ReactHost {
    require(reactNativeHost is DefaultReactNativeHost) {
      "You can call getDefaultReactHost only with instances of DefaultReactNativeHost"
    }
    return reactNativeHost.toReactHost(context)
  }
}
