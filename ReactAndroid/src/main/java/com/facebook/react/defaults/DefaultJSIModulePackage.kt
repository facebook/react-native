/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JSIModuleProvider
import com.facebook.react.bridge.JSIModuleSpec
import com.facebook.react.bridge.JSIModuleType
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.FabricJSIModuleProvider
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.uimanager.ViewManagerRegistry

/**
 * A utility class that allows users to create a JSIModulePackage to use Fabric. This essentially
 * allows users to just provide C++ implementation for the methods of `DefaultComponentsRegistry`
 * without providing all the extra machinery for the New Architecture.
 *
 * `ReactNativeHost` is required to create Fabric's ViewManagers.
 */
class DefaultJSIModulePackage(private val reactNativeHost: ReactNativeHost) : JSIModulePackage {

  override fun getJSIModules(
      reactApplicationContext: ReactApplicationContext,
      jsContext: JavaScriptContextHolder
  ): List<JSIModuleSpec<UIManager>> =
      listOf<JSIModuleSpec<UIManager>>(JSIModuleForFabric(reactApplicationContext, reactNativeHost))

  private inner class JSIModuleForFabric(
      private val reactApplicationContext: ReactApplicationContext,
      private val reactNativeHost: ReactNativeHost
  ) : JSIModuleSpec<UIManager> {
    override fun getJSIModuleType(): JSIModuleType = JSIModuleType.UIManager
    override fun getJSIModuleProvider(): JSIModuleProvider<UIManager> {
      val componentFactory = ComponentFactory()

      DefaultComponentsRegistry.register(componentFactory)

      val viewManagers =
          reactNativeHost.reactInstanceManager.getOrCreateViewManagers(reactApplicationContext)
      val viewManagerRegistry = ViewManagerRegistry(viewManagers)
      return FabricJSIModuleProvider(
          reactApplicationContext,
          componentFactory,
          ReactNativeConfig.DEFAULT_CONFIG,
          viewManagerRegistry)
    }
  }
}
