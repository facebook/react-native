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

@DoNotStripAny
internal object ComponentNameResolverBinding {
  init {
    SoLoader.loadLibrary("uimanagerjni")
  }

  @JvmStatic external fun install(runtimeExecutor: RuntimeExecutor, componentNameResolver: Any)
}
