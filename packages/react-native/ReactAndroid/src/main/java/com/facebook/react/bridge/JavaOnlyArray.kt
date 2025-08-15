/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.bridge.JavaOnlyMap.Companion.deepClone
import java.util.ArrayList

/**
 * Java [ArrayList] backed implementation of [ReadableArray] and [WritableArray] Instances of this
 * class SHOULD NOT be used for communication between java and JS, use instances of
 * [WritableNativeArray] created via [Arguments#createArray] or just [ReadableArray] interface if
 * you want your "native" module method to take an array from JS as an argument.
 *
 * Main purpose for this class is to be used in java-only unit tests, but could also be used outside
 * of tests in the code that operates only in java and needs to communicate with RN modules via
 * their JS-exposed API.
 */
public class JavaOnlyArray : ReadableArray, WritableArray {

  public companion object {
    @JvmStatic public fun from(list: List<*>): JavaOnlyArray = JavaOnlyArray(list)

    @JvmStatic public fun of(vararg values: Any?): JavaOnlyArray = JavaOnlyArray(*values)

    @JvmStatic
    public fun deepClone(array: ReadableArray?): JavaOnlyArray {
      val res = JavaOnlyArray()
      if (array == null) {
        return res
      }

      repeat(array.size()) { i ->
        val type = array.getType(i)
        when (type) {
          ReadableType.Null -> res.pushNull()
          ReadableType.Boolean -> res.pushBoolean(array.getBoolean(i))
          ReadableType.Number -> res.pushDouble(array.getDouble(i))
          ReadableType.String -> res.pushString(array.getString(i))
          ReadableType.Map -> res.pushMap(deepClone(array.getMap(i)))
          ReadableType.Array -> res.pushArray(deepClone(array.getArray(i)))
        }
      }
      return res
    }
  }

  private val backingList: MutableList<Any?>

  private constructor(vararg values: Any?) {
    backingList = mutableListOf(*values)
  }

  private constructor(list: List<*>) {
    backingList = ArrayList(list)
  }

  public constructor() {
    backingList = mutableListOf()
  }

  override fun size(): Int = backingList.size

  override fun isNull(index: Int): Boolean = backingList[index] == null

  override fun getDouble(index: Int): Double = (backingList[index] as Number).toDouble()

  override fun getInt(index: Int): Int = (backingList[index] as Number).toInt()

  override fun getLong(index: Int): Long = (backingList[index] as Number).toLong()

  override fun getString(index: Int): String? = backingList[index] as String?

  override fun getArray(index: Int): ReadableArray? = backingList[index] as ReadableArray?

  override fun getBoolean(index: Int): Boolean = backingList[index] as Boolean

  override fun getMap(index: Int): ReadableMap? = backingList[index] as ReadableMap?

  override fun getDynamic(index: Int): Dynamic = DynamicFromArray.create(this, index)

  override fun getType(index: Int): ReadableType {
    return when (val value = backingList[index]) {
      null -> ReadableType.Null
      is Boolean -> ReadableType.Boolean
      is Double,
      is Float,
      is Int,
      is Long -> ReadableType.Number
      is String -> ReadableType.String
      is ReadableArray -> ReadableType.Array
      is ReadableMap -> ReadableType.Map
      else -> throw IllegalStateException("Invalid type ${value.javaClass})")
    }
  }

  override fun pushBoolean(value: Boolean) {
    backingList.add(value)
  }

  override fun pushDouble(value: Double) {
    backingList.add(value)
  }

  override fun pushInt(value: Int) {
    backingList.add(value.toDouble())
  }

  override fun pushLong(value: Long) {
    backingList.add(value.toDouble())
  }

  override fun pushString(value: String?) {
    backingList.add(value)
  }

  override fun pushArray(array: ReadableArray?) {
    backingList.add(array)
  }

  override fun pushMap(map: ReadableMap?) {
    backingList.add(map)
  }

  override fun pushNull() {
    backingList.add(null)
  }

  override fun toArrayList(): ArrayList<Any?> = ArrayList(backingList)

  override fun toString(): String = backingList.toString()

  override fun equals(other: Any?): Boolean =
      if (this === other) {
        true
      } else if (other == null || javaClass != other.javaClass) {
        false
      } else {
        backingList == (other as JavaOnlyArray).backingList
      }

  override fun hashCode(): Int = backingList.hashCode()
}
