/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import javax.annotation.Nonnull;

/**
 * Interface for a mutable map. Used to pass arguments from Java to JS.
 */
public interface WritableMap extends ReadableMap {

  void putNull(@Nonnull String key);
  void putBoolean(@Nonnull String key, boolean value);
  void putDouble(@Nonnull String key, double value);
  void putInt(@Nonnull String key, int value);
  void putString(@Nonnull String key, @Nonnull String value);
  void putArray(@Nonnull String key, @Nonnull WritableArray value);
  void putMap(@Nonnull String key, @Nonnull WritableMap value);

  void merge(@Nonnull ReadableMap source);
}
