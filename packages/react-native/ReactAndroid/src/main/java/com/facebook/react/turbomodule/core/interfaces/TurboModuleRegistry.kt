/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces

import com.facebook.react.bridge.NativeModule

/**
 * Interface to allow for creating and retrieving NativeModules. Why is this this class prefixed
 * with "Turbo", even though it supports both legacy NativeModules, and TurboModules? Because there
 * already is a NativeModuleRegistry (a part of the legacy architecture). Once that class is
 * deleted, we should rename this interface accordingly.
 */
interface TurboModuleRegistry {
  /**
   * Return the NativeModule instance that has that name `moduleName`. If the `moduleName`
   * TurboModule hasn't been instantiated, instantiate it. If no TurboModule is registered under
   * `moduleName`, return null.
   */
  fun getModule(moduleName: String): NativeModule?

  /** Get all instantiated NativeModules. */
  val modules: Collection<NativeModule>

  /** Has the NativeModule with name `moduleName` been instantiated? */
  fun hasModule(moduleName: String): Boolean
  /**
   * Return the names of all the NativeModules that are supposed to be eagerly initialized. By
   * calling getModule on each name, this allows the application to eagerly initialize its
   * NativeModules.
   */
  val eagerInitModuleNames: List<String>
}
