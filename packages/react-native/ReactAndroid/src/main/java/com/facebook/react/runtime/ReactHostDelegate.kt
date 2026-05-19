/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.infer.annotation.ThreadSafe
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * [ReactHostDelegate] is an interface that defines parameters required to initialize React Native.
 * This interface works in combination with [com.facebook.react.ReactHost]
 */
@ThreadSafe
@UnstableReactNativeAPI
public interface ReactHostDelegate {
  /**
   * Path to your app's main module on Metro. This is used when reloading JS during development. All
   * paths are relative to the root folder the packager is serving files from. Examples:
   * `index.android` or `subdirectory/index.android`
   */
  public val jsMainModulePath: String

  /**
   * Object that holds a native C++ references that allow host applications to install C++ objects
   * into jsi::Runtime during the initialization of React Native
   */
  public val bindingsInstaller: BindingsInstaller?

  /** list of [ReactPackage] to expose Native Modules and View Components to JS */
  public val reactPackages: List<ReactPackage>

  /** Object that holds a native reference to the javascript engine */
  public val jsRuntimeFactory: JSRuntimeFactory

  /**
   * Bundle loader to use when setting up JS environment. <p>Example:
   * [JSBundleLoader.createFileLoader(application, bundleFile)]
   */
  public val jsBundleLoader: JSBundleLoader

  /** TODO: combine getTurboModuleManagerDelegate inside [ReactPackage] */
  public val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder

  /**
   * Callback that can be used by React Native host applications to react to exceptions thrown by
   * the internals of React Native.
   */
  public fun handleInstanceException(error: Exception)
}
