/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces;

/** All turbo modules should inherit from this interface */
public interface TurboModule {
  /** Initialize the TurboModule. */
  void initialize();

  /** Called before React Native is torn down. Clean up after the TurboModule. */
  void invalidate();
}
