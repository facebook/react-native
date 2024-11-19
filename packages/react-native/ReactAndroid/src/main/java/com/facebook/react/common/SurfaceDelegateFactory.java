/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;

/**
 * Factory to create a {@link SurfaceDelegate}. The moduleName is needed to help the factory decide
 * which surface to return {@link SurfaceDelegate} that the given module should use to interact
 * with.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public interface SurfaceDelegateFactory {
  /**
   * Create a {@link SurfaceDelegate} instance which is used to interact with a surface of platform
   * the app is running in.
   *
   * @param moduleName the module name that will be using the surface
   * @return {@link SurfaceDelegate} instance
   */
  @Nullable
  SurfaceDelegate createSurfaceDelegate(String moduleName);
}
