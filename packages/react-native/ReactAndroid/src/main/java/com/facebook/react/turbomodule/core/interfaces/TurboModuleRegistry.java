/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import java.util.Collection;
import java.util.List;

/**
 * Interface to allow for creating and retrieving NativeModules. Why is this this class prefixed
 * with "Turbo", even though it supports both legacy NativeModules, and TurboModules? Because there
 * already is a NativeModuleRegistry (a part of the legacy architecture). Once that class is
 * deleted, we should rename this interface accordingly.
 */
public interface TurboModuleRegistry {
  /**
   * Return the NativeModule instance that has that name `moduleName`. If the `moduleName`
   * TurboModule hasn't been instantiated, instantiate it. If no TurboModule is registered under
   * `moduleName`, return null.
   */
  @Nullable
  NativeModule getModule(String moduleName);

  /** Get all instantiated NativeModules. */
  Collection<NativeModule> getModules();

  /** Has the NativeModule with name `moduleName` been instantiated? */
  boolean hasModule(String moduleName);

  /**
   * Return the names of all the NativeModules that are supposed to be eagerly initialized. By
   * calling getModule on each name, this allows the application to eagerly initialize its
   * NativeModules.
   */
  List<String> getEagerInitModuleNames();
}
