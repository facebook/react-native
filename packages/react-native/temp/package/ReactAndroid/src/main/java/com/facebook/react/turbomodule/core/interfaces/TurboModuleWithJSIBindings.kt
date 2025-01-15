/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces

import com.facebook.proguard.annotations.DoNotStrip

/** Implements this interface if a TurboModule needs to install its own JSI bindings. */
@DoNotStrip
public interface TurboModuleWithJSIBindings {
  /**
   * Returns the [BindingsInstallerHolder] that the core will later invoke with an
   * `facebook::jsi::Runtime` instance. The implementation will typically mix with JNI and C++.
   */
  @DoNotStrip public fun getBindingsInstaller(): BindingsInstallerHolder
}
