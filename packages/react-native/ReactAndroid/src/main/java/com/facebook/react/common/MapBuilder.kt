/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

/** Utility class for creating maps */
@Deprecated("Use Kotlin's built-in collections extensions")
public object MapBuilder {
  /** Creates an instance of `HashMap` */
  @JvmStatic public fun <K, V> newHashMap(): HashMap<K, V> = hashMapOf()

  /** Returns the empty map. */
  @JvmStatic public fun <K, V> of(): MutableMap<K, V> = newHashMap()

  /** Returns map containing a single entry. */
  @JvmStatic public fun <K, V> of(k1: K, v1: V): MutableMap<K, V> = hashMapOf(k1 to v1)

  /** Returns map containing the given entries. */
  @JvmStatic
  public fun <K, V> of(k1: K, v1: V, k2: K, v2: V): MutableMap<K, V> = hashMapOf(k1 to v1, k2 to v2)

  /** Returns map containing the given entries. */
  @JvmStatic
  public fun <K, V> of(k1: K, v1: V, k2: K, v2: V, k3: K, v3: V): MutableMap<K, V> =
      hashMapOf(k1 to v1, k2 to v2, k3 to v3)

  /** Returns map containing the given entries. */
  @JvmStatic
  public fun <K, V> of(k1: K, v1: V, k2: K, v2: V, k3: K, v3: V, k4: K, v4: V): MutableMap<K, V> =
      hashMapOf(k1 to v1, k2 to v2, k3 to v3, k4 to v4)

  /** Returns map containing the given entries. */
  @JvmStatic
  public fun <K, V> of(
      k1: K,
      v1: V,
      k2: K,
      v2: V,
      k3: K,
      v3: V,
      k4: K,
      v4: V,
      k5: K,
      v5: V
  ): MutableMap<K, V> = hashMapOf(k1 to v1, k2 to v2, k3 to v3, k4 to v4, k5 to v5)

  /** Returns map containing the given entries. */
  @JvmStatic
  public fun <K, V> of(
      k1: K,
      v1: V,
      k2: K,
      v2: V,
      k3: K,
      v3: V,
      k4: K,
      v4: V,
      k5: K,
      v5: V,
      k6: K,
      v6: V
  ): MutableMap<K, V> = hashMapOf(k1 to v1, k2 to v2, k3 to v3, k4 to v4, k5 to v5, k6 to v6)

  /** Returns map containing the given entries. */
  @JvmStatic
  public fun <K, V> of(
      k1: K,
      v1: V,
      k2: K,
      v2: V,
      k3: K,
      v3: V,
      k4: K,
      v4: V,
      k5: K,
      v5: V,
      k6: K,
      v6: V,
      k7: K,
      v7: V
  ): MutableMap<K, V> =
      hashMapOf(k1 to v1, k2 to v2, k3 to v3, k4 to v4, k5 to v5, k6 to v6, k7 to v7)

  /** Returns map containing the given entries. */
  @JvmStatic public fun <K, V> builder(): Builder<K, V> = Builder()

  public class Builder<K, V> internal constructor() {
    private val map: MutableMap<K, V> = newHashMap()
    private var underConstruction = true

    public fun put(k: K, v: V): Builder<K, V> {
      check(underConstruction) { "Underlying map has already been built" }
      map[k] = v
      return this
    }

    public fun build(): Map<K, V> {
      check(underConstruction) { "Underlying map has already been built" }
      underConstruction = false
      return map
    }
  }
}
