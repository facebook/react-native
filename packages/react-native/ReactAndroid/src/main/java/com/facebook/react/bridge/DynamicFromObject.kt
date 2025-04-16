/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.bridge

import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Nullsafe
import com.facebook.react.common.ReactConstants

/** Implementation of Dynamic wrapping a ReadableArray.  */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class DynamicFromObject(private val value: Any?) : Dynamic {
  override fun recycle() {
    // Noop - nothing to recycle since there is no pooling
  }

  override val isNull: Boolean
    get() = value == null

  override fun asBoolean(): Boolean {
    if (value is Boolean) {
      return value
    }
    throw ClassCastException("Dynamic value from Object is not a boolean")
  }

  override fun asDouble(): Double {
    if (value is Number) {
      return value as Double
    }
    throw ClassCastException("Dynamic value from Object is not a number")
  }

  override fun asInt(): Int {
    if (value is Number) {
      // Numbers from JS are always Doubles
      return (value as Double).toInt()
    }
    throw ClassCastException("Dynamic value from Object is not a number")
  }

  override fun asString(): String? {
    if (value is String) {
      return value
    }
    throw ClassCastException("Dynamic value from Object is not a string")
  }

  override fun asArray(): ReadableArray? {
    if (value is ReadableArray) {
      return value
    }
    throw ClassCastException("Dynamic value from Object is not a ReadableArray")
  }

  override fun asMap(): ReadableMap? {
    if (value is ReadableMap) {
      return value
    }
    throw ClassCastException("Dynamic value from Object is not a ReadableMap")
  }

  override val type: ReadableType
    get() {
      if (isNull) {
        return ReadableType.Null
      }
      if (value is Boolean) {
        return ReadableType.Boolean
      }
      if (value is Number) {
        return ReadableType.Number
      }
      if (value is String) {
        return ReadableType.String
      }
      if (value is ReadableMap) {
        return ReadableType.Map
      }
      if (value is ReadableArray) {
        return ReadableType.Array
      }
      FLog.e(
        ReactConstants.TAG,
        "Unmapped object type "
          + (if (value == null) "<NULL object>" else value.javaClass.name)
      )
      return ReadableType.Null
    }
}
