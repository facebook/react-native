/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.annotation.Nullable
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants

/** Implementation of Dynamic wrapping a ReadableArray. */
class DynamicFromObject(@Nullable private var mObject: Any?) : Dynamic {

  override fun recycle() {
    // Noop - nothing to recycle since there is no pooling
  }

  override fun isNull(): Boolean {
    return mObject == null
  }

  override fun asBoolean(): Boolean {
    if (mObject !is Boolean) {
      throw ClassCastException("Dynamic value from Object is not a boolean")
    }
    return mObject as Boolean
  }

  override fun asDouble(): Double {
    if (mObject !is Number) {
      throw ClassCastException("Dynamic value from Object is not a number")
    }
    return (mObject as Number).toDouble()
  }

  override fun asInt(): Int {
    if (mObject !is Number) {
      throw ClassCastException("Dynamic value from Object is not a number")
    }
    // Numbers from JS are always Doubles
    return (mObject as Double).toInt()
  }

  override fun asString(): String {
    if (mObject !is String) {
      throw ClassCastException("Dynamic value from Object is not a string")
    }
    return mObject as String
  }

  override fun asArray(): ReadableArray {
    if (mObject !is ReadableArray) {
      throw ClassCastException("Dynamic value from Object is not a ReadableArray")
    }
    return mObject as ReadableArray
  }

  override fun asMap(): ReadableMap {
    if (mObject !is ReadableMap) {
      throw ClassCastException("Dynamic value from Object is not a ReadableMap")
    }
    return mObject as ReadableMap
  }

  override fun getType(): ReadableType {
    return when {
      isNull() -> ReadableType.Null
      mObject is Boolean -> ReadableType.Boolean
      mObject is Number -> ReadableType.Number
      mObject is String -> ReadableType.String
      mObject is ReadableMap -> ReadableType.Map
      mObject is ReadableArray -> ReadableType.Array
      else -> {
        FLog.e(
          ReactConstants.TAG,
          "Unmapped object type " + (mObject?.javaClass?.name ?: "<NULL object>")
        )
        ReadableType.Null
      }
    }
  }
}
