/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/** Marker interface used to represent a JSI Module. */
public interface JSIModule {

  /**
   * This is called at the end of {@link CatalystApplicationFragment#createCatalystInstance()} after
   * the CatalystInstance has been created, in order to initialize NativeModules that require the
   * CatalystInstance or JS modules.
   */
  void initialize();

  /** Called before {CatalystInstance#onHostDestroy} */
  void invalidate();
}
