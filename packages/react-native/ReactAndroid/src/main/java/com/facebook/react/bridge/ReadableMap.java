/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

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

  @Nullable
  String getString(@NonNull String name);

  @Nullable
  ReadableArray getArray(@NonNull String name);

  @Nullable
  ReadableMap getMap(@NonNull String name);

  @NonNull
  Dynamic getDynamic(@NonNull String name);

  @NonNull
  ReadableType getType(@NonNull String name);

  @NonNull
  Iterator<Map.Entry<String, Object>> getEntryIterator();

  @NonNull
  ReadableMapKeySetIterator keySetIterator();

  @NonNull
  HashMap<String, Object> toHashMap();
}
