/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.core.util.Pools.SimplePool

/** Implementation of Dynamic wrapping a ReadableMap. */
internal class DynamicFromMap
// This is a pools object. Hide the constructor.
private constructor() : Dynamic {
  private var map: ReadableMap? = null
  private var name: String? = null

  override fun recycle() {
    map = null
    name = null
    pool.get()?.release(this)
  }

  override val isNull: Boolean
    get() {
      return accessMapSafely { map, name -> map.isNull(name) }
    }

  override fun asBoolean(): Boolean = accessMapSafely { map, name -> map.getBoolean(name) }

  override fun asDouble(): Double = accessMapSafely { map, name -> map.getDouble(name) }

  override fun asInt(): Int = accessMapSafely { map, name -> map.getInt(name) }

  override fun asString(): String? = accessMapSafely { map, name -> map.getString(name) }

  override fun asArray(): ReadableArray? = accessMapSafely { map, name -> map.getArray(name) }

  override fun asMap(): ReadableMap? = accessMapSafely { map, name -> map.getMap(name) }

  override val type: ReadableType
    get() {
      return accessMapSafely { map, name -> map.getType(name) }
    }

  /**
   * Asserts that both map and name are non-null and invokes the lambda with
   *
   * @param executor the callback to be invoked with non-null-asserted prop values
   * @return value returned by the executor
   */
  private fun <T> accessMapSafely(executor: (map: ReadableMap, name: String) -> T): T {
    val name = checkNotNull(name) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }
    val map = checkNotNull(map) { DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE }

    return executor(map, name)
  }

  companion object {
    private val pool: ThreadLocal<SimplePool<DynamicFromMap>> =
        object : ThreadLocal<SimplePool<DynamicFromMap>>() {
          override fun initialValue(): SimplePool<DynamicFromMap> {
            return SimplePool(10)
          }
        }

    private const val DYNAMIC_VALUE_RECYCLED_FAILURE_MESSAGE =
        "This dynamic value has been recycled"

    fun create(map: ReadableMap, name: String): DynamicFromMap {
      val dynamic = pool.get()?.acquire() ?: DynamicFromMap()

      return dynamic.apply {
        this.map = map
        this.name = name
      }
    }
  }
}
