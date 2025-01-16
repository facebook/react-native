/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.common

/**
 * Factory to create a [SurfaceDelegate]. The moduleName is needed to help the factory decide which
 * surface to return [SurfaceDelegate] that the given module should use to interact with.
 */
public fun interface SurfaceDelegateFactory {
  /**
   * Create a [SurfaceDelegate] instance which is used to interact with a surface of platform the
   * app is running in.
   *
   * @param moduleName the module name that will be using the surface
   * @return [SurfaceDelegate] instance
   */
  public fun createSurfaceDelegate(moduleName: String): SurfaceDelegate?
}
