/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import java.util.HashMap;

/**
 * Interface for a map that allows typed access to its members. Used to pass parameters from JS to
 * Java.
 */
public interface ReadableMap {

  boolean hasKey(@NonNull String name);
  boolean isNull(@NonNull String name);
  boolean getBoolean(@NonNull String name);
  double getDouble(@NonNull String name);
  int getInt(@NonNull String name);
  @Nullable String getString(@NonNull String name);
  @Nullable ReadableArray getArray(@NonNull String name);
  @Nullable ReadableMap getMap(@NonNull String name);
  @NonNull Dynamic getDynamic(@NonNull String name);
  @NonNull ReadableType getType(@NonNull String name);
  @NonNull ReadableMapKeySetIterator keySetIterator();
  @NonNull HashMap<String, Object> toHashMap();

}
