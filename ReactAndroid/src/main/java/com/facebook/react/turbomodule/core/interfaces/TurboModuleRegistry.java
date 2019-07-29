/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.turbomodule.core.interfaces;

import androidx.annotation.Nullable;
import java.util.Collection;

/** Interface to allow for creating and retrieving TurboModules. */
public interface TurboModuleRegistry {

  /**
   * Return the TurboModule instance that has that name `moduleName`. If the `moduleName`
   * TurboModule hasn't been instantiated, instantiate it. If no TurboModule is registered under
   * `moduleName`, return null.
   */
  @Nullable
  TurboModule getModule(String moduleName);

  /** Get all instantiated TurboModules. */
  Collection<TurboModule> getModules();

  /** Has the TurboModule with name `moduleName` been instantiated? */
  boolean hasModule(String moduleName);
}
