/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * Interface for a map that allows typed access to its members. Used to pass parameters from JS to
 * Java.
 */
public interface ReadableMap {

  boolean hasKey(@Nonnull String name);

  boolean isNull(@Nonnull String name);

  boolean getBoolean(@Nonnull String name);

  double getDouble(@Nonnull String name);

  int getInt(@Nonnull String name);

  @Nullable
  String getString(@Nonnull String name);

  @Nullable
  ReadableArray getArray(@Nonnull String name);

  @Nullable
  ReadableMap getMap(@Nonnull String name);

  @Nonnull
  Dynamic getDynamic(@Nonnull String name);

  @Nonnull
  ReadableType getType(@Nonnull String name);

  @Nonnull
  Iterator<Map.Entry<String, Object>> getEntryIterator();

  @Nonnull
  ReadableMapKeySetIterator keySetIterator();

  @Nonnull
  HashMap<String, Object> toHashMap();
}
