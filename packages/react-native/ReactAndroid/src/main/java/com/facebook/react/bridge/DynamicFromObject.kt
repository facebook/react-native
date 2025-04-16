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
public class DynamicFromObject(private val mObject: Any?) : Dynamic {
  override fun recycle() {
    // Noop - nothing to recycle since there is no pooling
  }

  override val isNull: Boolean
    get() = mObject == null

  override fun asBoolean(): Boolean {
    if (mObject == null || mObject !is Boolean) {
      throw ClassCastException("Dynamic value from Object is not a boolean")
    }
    return mObject
  }

  override fun asDouble(): Double {
    if (mObject == null || mObject !is Number) {
      throw ClassCastException("Dynamic value from Object is not a number")
    }
    return mObject as Double
  }

  override fun asInt(): Int {
    if (mObject == null || mObject !is Number) {
      throw ClassCastException("Dynamic value from Object is not a number")
    }
    // Numbers from JS are always Doubles
    return (mObject as Double).toInt()
  }

  override fun asString(): String? {
    if (mObject == null || mObject !is String) {
      throw ClassCastException("Dynamic value from Object is not a string")
    }
    return mObject
  }

  override fun asArray(): ReadableArray? {
    if (mObject == null || mObject !is ReadableArray) {
      throw ClassCastException("Dynamic value from Object is not a ReadableArray")
    }
    return mObject
  }

  override fun asMap(): ReadableMap? {
    if (mObject == null || mObject !is ReadableMap) {
      throw ClassCastException("Dynamic value from Object is not a ReadableMap")
    }
    return mObject
  }

  override val type: ReadableType
    get() {
      if (isNull) {
        return ReadableType.Null
      }
      if (mObject is Boolean) {
        return ReadableType.Boolean
      }
      if (mObject is Number) {
        return ReadableType.Number
      }
      if (mObject is String) {
        return ReadableType.String
      }
      if (mObject is ReadableMap) {
        return ReadableType.Map
      }
      if (mObject is ReadableArray) {
        return ReadableType.Array
      }
      FLog.e(
        ReactConstants.TAG,
        "Unmapped object type "
          + (if (mObject == null) "<NULL object>" else mObject.javaClass.name)
      )
      return ReadableType.Null
    }
}
