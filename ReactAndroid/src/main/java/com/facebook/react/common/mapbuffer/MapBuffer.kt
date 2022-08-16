/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.mapbuffer

/**
 * MapBuffer is an optimized sparse array format for transferring props-like data between C++ and
 * JNI. It is designed to:
 * - be compact to optimize space when sparse (sparse is the common case).
 * - be accessible through JNI with zero/minimal copying.
 * - work recursively for nested maps/arrays.
 * - support dynamic types that map to JSON.
 * - have minimal APK size and build time impact.
 *
 * See <react/renderer/mapbuffer/MapBuffer.h> for more information and native implementation.
 *
 * Limitations:
 * - Keys are usually sized as 2 bytes, with each buffer supporting up to 65536 entries as a result.
 * - O(log(N)) random key access for native buffers due to selected structure. Faster access can be
 * achieved by retrieving [MapBuffer.Entry] with [entryAt] on known offsets.
 */
interface MapBuffer : Iterable<MapBuffer.Entry> {
  companion object {
    /**
     * Key are represented as 2 byte values, and typed as Int for ease of access. The serialization
     * format only allows to store [UShort] values.
     */
    internal val KEY_RANGE = IntRange(UShort.MIN_VALUE.toInt(), UShort.MAX_VALUE.toInt())
  }

  /**
   * Data types supported by [MapBuffer]. Keep in sync with definition in
   * `<react/renderer/mapbuffer/MapBuffer.h>`, as enum serialization relies on correct order.
   */
  enum class DataType {
    BOOL,
    INT,
    DOUBLE,
    STRING,
    MAP
  }

  /**
   * Number of elements inserted into current MapBuffer.
   * @return number of elements in the [MapBuffer]
   */
  val count: Int

  /**
   * Checks whether entry for given key exists in MapBuffer.
   * @param key key to lookup the entry
   * @return whether entry for the given key exists in the MapBuffer.
   */
  fun contains(key: Int): Boolean

  /**
   * Provides offset of the key to use for [entryAt], for cases when offset is not statically known
   * but can be cached.
   * @param key key to lookup offset for
   * @return offset for the given key to be used for entry access, -1 if key wasn't found.
   */
  fun getKeyOffset(key: Int): Int

  /**
   * Provides parsed access to a MapBuffer without additional lookups for provided offset.
   * @param offset offset of entry in the MapBuffer structure. Can be looked up for known keys with
   * [getKeyOffset].
   * @return parsed entry for structured access for given offset
   */
  fun entryAt(offset: Int): MapBuffer.Entry

  /**
   * Provides parsed [DataType] annotation associated with the given key.
   * @param key key to lookup type for
   * @return data type of the given key.
   * @throws IllegalArgumentException if the key doesn't exist
   */
  fun getType(key: Int): DataType

  /**
   * Provides parsed [Boolean] value if the entry for given key exists with [DataType.BOOL] type
   * @param key key to lookup [Boolean] value for
   * @return value associated with the requested key
   * @throws IllegalArgumentException if the key doesn't exist
   * @throws IllegalStateException if the data type doesn't match
   */
  fun getBoolean(key: Int): Boolean

  /**
   * Provides parsed [Int] value if the entry for given key exists with [DataType.INT] type
   * @param key key to lookup [Int] value for
   * @return value associated with the requested key
   * @throws IllegalArgumentException if the key doesn't exist
   * @throws IllegalStateException if the data type doesn't match
   */
  fun getInt(key: Int): Int

  /**
   * Provides parsed [Double] value if the entry for given key exists with [DataType.DOUBLE] type
   * @param key key to lookup [Double] value for
   * @return value associated with the requested key
   * @throws IllegalArgumentException if the key doesn't exist
   * @throws IllegalStateException if the data type doesn't match
   */
  fun getDouble(key: Int): Double

  /**
   * Provides parsed [String] value if the entry for given key exists with [DataType.STRING] type
   * @param key key to lookup [String] value for
   * @return value associated with the requested key
   * @throws IllegalArgumentException if the key doesn't exist
   * @throws IllegalStateException if the data type doesn't match
   */
  fun getString(key: Int): String

  /**
   * Provides parsed [MapBuffer] value if the entry for given key exists with [DataType.MAP] type
   * @param key key to lookup [MapBuffer] value for
   * @return value associated with the requested key
   * @throws IllegalArgumentException if the key doesn't exist
   * @throws IllegalStateException if the data type doesn't match
   */
  fun getMapBuffer(key: Int): MapBuffer

  /**
   * Provides parsed [List<MapBuffer>] value if the entry for given key exists with [DataType.MAP]
   * type
   * @param key key to lookup [List<MapBuffer>] value for
   * @return value associated with the requested key
   * @throws IllegalArgumentException if the key doesn't exist
   * @throws IllegalStateException if the data type doesn't match
   */
  fun getMapBufferList(key: Int): List<MapBuffer>

  /** Iterable entry representing parsed MapBuffer values */
  interface Entry {
    /**
     * Key of the given entry. Usually represented as 2 byte unsigned integer with the value range
     * of [0,65536)
     */
    val key: Int

    /** Parsed [DataType] of the entry */
    val type: DataType

    /**
     * Entry value represented as [Boolean]
     * @throws IllegalStateException if the data type doesn't match [DataType.BOOL]
     */
    val booleanValue: Boolean

    /**
     * Entry value represented as [Int]
     * @throws IllegalStateException if the data type doesn't match [DataType.INT]
     */
    val intValue: Int

    /**
     * Entry value represented as [Double]
     * @throws IllegalStateException if the data type doesn't match [DataType.DOUBLE]
     */
    val doubleValue: Double

    /**
     * Entry value represented as [String]
     * @throws IllegalStateException if the data type doesn't match [DataType.STRING]
     */
    val stringValue: String

    /**
     * Entry value represented as [MapBuffer]
     * @throws IllegalStateException if the data type doesn't match [DataType.MAP]
     */
    val mapBufferValue: MapBuffer
  }
}
