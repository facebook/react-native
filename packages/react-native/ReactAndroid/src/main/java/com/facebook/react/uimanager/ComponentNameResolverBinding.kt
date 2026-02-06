/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.soloader.SoLoader
import kotlin.jvm.JvmStatic

/**
 * JNI binding for installing a ComponentNameResolver into the JavaScript runtime.
 *
 * This object provides a native binding to install a [ComponentNameResolver] into the React Native
 * JavaScript runtime, making component name information available to the native side.
 */
@DoNotStripAny
internal object ComponentNameResolverBinding {
  init {
    SoLoader.loadLibrary("uimanagerjni")
  }

  /**
   * Installs a ComponentNameResolver into the JavaScript runtime.
   *
   * @param runtimeExecutor The runtime executor for the JavaScript runtime
   * @param componentNameResolver The component name resolver to install
   */
  @JvmStatic external fun install(runtimeExecutor: RuntimeExecutor, componentNameResolver: Any)
}
