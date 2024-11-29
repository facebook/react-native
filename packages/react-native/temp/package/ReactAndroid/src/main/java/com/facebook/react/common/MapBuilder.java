/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import com.facebook.infer.annotation.Nullsafe;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for creating maps
 *
 * @deprecated Use Kotlin's built-in collections extensions
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@Deprecated
public class MapBuilder {

  /** Creates an instance of {@code HashMap} */
  public static <K, V> HashMap<K, V> newHashMap() {
    return new HashMap<K, V>();
  }

  /** Returns the empty map. */
  public static <K, V> Map<K, V> of() {
    return newHashMap();
  }

  /** Returns map containing a single entry. */
  public static <K, V> Map<K, V> of(K k1, V v1) {
    Map map = of();
    map.put(k1, v1);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2) {
    Map map = of();
    map.put(k1, v1);
    map.put(k2, v2);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2, K k3, V v3) {
    Map map = of();
    map.put(k1, v1);
    map.put(k2, v2);
    map.put(k3, v3);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2, K k3, V v3, K k4, V v4) {
    Map map = of();
    map.put(k1, v1);
    map.put(k2, v2);
    map.put(k3, v3);
    map.put(k4, v4);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2, K k3, V v3, K k4, V v4, K k5, V v5) {
    Map map = of();
    map.put(k1, v1);
    map.put(k2, v2);
    map.put(k3, v3);
    map.put(k4, v4);
    map.put(k5, v5);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Map<K, V> of(
      K k1, V v1, K k2, V v2, K k3, V v3, K k4, V v4, K k5, V v5, K k6, V v6) {
    Map map = of();
    map.put(k1, v1);
    map.put(k2, v2);
    map.put(k3, v3);
    map.put(k4, v4);
    map.put(k5, v5);
    map.put(k6, v6);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Map<K, V> of(
      K k1, V v1, K k2, V v2, K k3, V v3, K k4, V v4, K k5, V v5, K k6, V v6, K k7, V v7) {
    Map map = of();
    map.put(k1, v1);
    map.put(k2, v2);
    map.put(k3, v3);
    map.put(k4, v4);
    map.put(k5, v5);
    map.put(k6, v6);
    map.put(k7, v7);
    return map;
  }

  /** Returns map containing the given entries. */
  public static <K, V> Builder<K, V> builder() {
    return new Builder();
  }

  public static final class Builder<K, V> {

    private Map mMap;
    private boolean mUnderConstruction;

    private Builder() {
      mMap = newHashMap();
      mUnderConstruction = true;
    }

    public Builder<K, V> put(K k, V v) {
      if (!mUnderConstruction) {
        throw new IllegalStateException("Underlying map has already been built");
      }
      mMap.put(k, v);
      return this;
    }

    public Map<K, V> build() {
      if (!mUnderConstruction) {
        throw new IllegalStateException("Underlying map has already been built");
      }
      mUnderConstruction = false;
      return mMap;
    }
  }
}
