/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces

import com.facebook.proguard.annotations.DoNotStrip

/**
 * If a turbo module needs to install its custom JSI bindings, it should implement this interface.
 */
@DoNotStrip
public interface TurboModuleWithJSIBindings {
  /**
   * The method to install JSI bindings.
   * The implementation will typically call into C++ for JSI setup through JNI.
   * @param runtime The (facebook::jsi::Runtime *) pointer casted to Long type.
   */
  @DoNotStrip
  public fun installJSIBindings(runtime: Long)
}
