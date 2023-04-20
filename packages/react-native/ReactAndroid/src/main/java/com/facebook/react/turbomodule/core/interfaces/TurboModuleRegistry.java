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
   * Return the TurboModule instance that has that name `moduleName`. If the `moduleName`
   * TurboModule hasn't been instantiated, instantiate it. If no TurboModule is registered under
   * `moduleName`, return null.
   */
  @Deprecated
  @Nullable
  TurboModule getModule(String moduleName);

  /** Get all instantiated TurboModules. */
  @Deprecated
  Collection<TurboModule> getModules();

  /** Has the TurboModule with name `moduleName` been instantiated? */
  @Deprecated
  boolean hasModule(String moduleName);

  /**
   * Return the NativeModule instance that has that name `moduleName`. If the `moduleName`
   * NativeModule hasn't been instantiated, instantiate it. If no NativeModule is registered under
   * `moduleName`, return null.
   */
  @Nullable
  NativeModule getNativeModule(String moduleName);

  /** Get all instantiated NativeModule. */
  Collection<NativeModule> getNativeModules();

  /** Has the NativeModule with name `moduleName` been instantiated? */
  boolean hasNativeModule(String moduleName);

  /**
   * Return the names of all the NativeModules that are supposed to be eagerly initialized. By
   * calling getModule on each name, this allows the application to eagerly initialize its
   * NativeModules.
   */
  List<String> getEagerInitModuleNames();
}
