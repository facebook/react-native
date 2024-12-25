/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip
import java.util.ArrayList
import java.util.Arrays
import kotlin.jvm.JvmStatic

/**
 * Implementation of a NativeArray that allows read-only access to its members. This will generally
 * be constructed and filled in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public open class ReadableNativeArray protected constructor() : NativeArray(), ReadableArray {

  private val localArray: Array<Any?> by
      lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        jniPassCounter++
        importArray()
      }

  private external fun importArray(): Array<Any?>

  private val localTypeArray: Array<ReadableType> by
      lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        jniPassCounter++
        val tempArray = importTypeArray()
        Arrays.copyOf(tempArray, tempArray.size, Array<ReadableType>::class.java)
      }

  private external fun importTypeArray(): Array<Any>

  override fun size(): Int = localArray.size

  override fun isNull(index: Int): Boolean = localArray[index] == null

  override fun getBoolean(index: Int): Boolean = localArray[index] as Boolean

  override fun getDouble(index: Int): Double = localArray[index] as Double

  override fun getInt(index: Int): Int = (localArray[index] as Double).toInt()

  override fun getLong(index: Int): Long = localArray[index] as Long

  override fun getString(index: Int): String? = localArray[index] as String?

  override fun getArray(index: Int): ReadableNativeArray? =
      localArray[index] as ReadableNativeArray?

  override fun getMap(index: Int): ReadableNativeMap? = localArray[index] as ReadableNativeMap?

  override fun getType(index: Int): ReadableType = localTypeArray[index]

  override fun getDynamic(index: Int): Dynamic = DynamicFromArray.create(this, index)

  override fun hashCode(): Int = localArray.hashCode()

  override fun equals(other: Any?): Boolean {
    if (other !is ReadableNativeArray) {
      return false
    }
    return localArray.contentDeepEquals(other.localArray)
  }

  override fun toArrayList(): ArrayList<Any?> {
    val arrayList = ArrayList<Any?>()
    repeat(size()) { i ->
      when (getType(i)) {
        ReadableType.Null -> arrayList.add(null)
        ReadableType.Boolean -> arrayList.add(getBoolean(i))
        ReadableType.Number -> arrayList.add(getDouble(i))
        ReadableType.String -> arrayList.add(getString(i))
        ReadableType.Map -> arrayList.add(getMap(i)?.toHashMap())
        ReadableType.Array -> arrayList.add(getArray(i)?.toArrayList())
      }
    }
    return arrayList
  }

  private companion object {
    @get:JvmStatic
    @get:JvmName("getJNIPassCounter")
    public var jniPassCounter: Int = 0
      private set
  }
}
