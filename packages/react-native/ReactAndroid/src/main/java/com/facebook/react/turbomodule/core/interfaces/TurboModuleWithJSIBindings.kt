/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.turbomodule.core.JSIBindingsInstaller

/**
 * If a turbo module needs to install its custom JSI bindings, it should implement this interface.
 */
@DoNotStripAny
public interface TurboModuleWithJSIBindings {
  /**
   * Returns the [JSIBindingsInstaller] callback that the core will later invoke with
   * an `facebook::jsi::Runtime` instance.
   * The implementation will typically mix with JNI and C++.
   */
  public fun getJSIBindingsInstaller(): JSIBindingsInstaller
}
