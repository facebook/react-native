/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

/**
 * Object wrapping an auto-expanding [LongArray]. Like an `ArrayList<Long>` but without the
 * autoboxing.
 */
public class LongExpandingArray private constructor(initialCapacity: Int) {

  private var array: LongArray = LongArray(initialCapacity)
  private var length: Int = 0

  public fun add(value: Long): Unit {
    growArrayIfNeeded()
    array[length++] = value
  }

  public operator fun get(index: Int): Long {
    if (index >= length) {
      throw IndexOutOfBoundsException("$index >= $length")
    }
    return array[index]
  }

  public operator fun set(index: Int, value: Long): Unit {
    if (index >= length) {
      throw IndexOutOfBoundsException("$index >= $length")
    }
    array[index] = value
  }

  public fun size(): Int = length

  public val isEmpty: Boolean
    get() = length == 0

  /** Removes the *last* n items of the array all at once. */
  public fun dropTail(n: Int): Unit {
    if (n > length) {
      throw IndexOutOfBoundsException("Trying to drop $n items from array of length $length")
    }
    length -= n
  }

  private fun growArrayIfNeeded() {
    if (length == array.size) {
      // If the initial capacity was 1 we need to ensure it at least grows by 1.
      val newSize = Math.max(length + 1, (length * INNER_ARRAY_GROWTH_FACTOR).toInt())
      array = array.copyOf(newSize)
    }
  }

  public companion object {
    private const val INNER_ARRAY_GROWTH_FACTOR = 1.8

    @JvmStatic
    public fun createWithInitialCapacity(initialCapacity: Int): LongExpandingArray =
        LongExpandingArray(initialCapacity)
  }
}
