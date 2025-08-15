/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import androidx.core.util.Pools.Pool

/**
 * Like [androidx.core.util.Pools.SynchronizedPool] with the option to clear the pool (e.g. on
 * memory pressure).
 */
internal class ClearableSynchronizedPool<T : Any>(maxSize: Int) : Pool<T> {

  private val pool: Array<Any?> = arrayOfNulls(maxSize)
  private var size = 0

  @Synchronized
  @Suppress("UNCHECKED_CAST", "KotlinGenericsCast")
  override fun acquire(): T? {
    if (size == 0) {
      return null
    }
    size--
    val lastIndex = size
    val toReturn = pool[lastIndex] as T
    pool[lastIndex] = null
    return toReturn
  }

  @Synchronized
  override fun release(instance: T): Boolean {
    if (size == pool.size) {
      return false
    }
    pool[size] = instance
    size++
    return true
  }

  @Synchronized
  fun clear(): Unit {
    for (i in 0 until size) {
      pool[i] = null
    }
    size = 0
  }
}
