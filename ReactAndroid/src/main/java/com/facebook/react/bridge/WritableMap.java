/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Interface for a mutable map. Used to pass arguments from Java to JS.
 */
public interface WritableMap extends ReadableMap {

  void putNull(@NonNull String key);
  void putBoolean(@NonNull String key, boolean value);
  void putDouble(@NonNull String key, double value);
  void putInt(@NonNull String key, int value);
  void putString(@NonNull String key, @Nullable String value);
  void putArray(@NonNull String key, @Nullable WritableArray value);
  void putMap(@NonNull String key, @Nullable WritableMap value);

  void merge(@NonNull ReadableMap source);
}
