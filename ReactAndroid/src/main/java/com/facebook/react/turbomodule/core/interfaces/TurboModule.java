/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.turbomodule.core.interfaces;

/** All turbo modules should inherit from this interface */
public interface TurboModule {
  /**
   * When CatalystInstance is destroyed, this method will be called. All implementing TurboModules
   * can perform cleanup here.
   */
  void invalidate();
}
