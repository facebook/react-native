/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import javax.annotation.Nullable;

/**
 * Implementation of Dynamic wrapping a ReadableArray.
 */
public class DynamicFromObject implements Dynamic {
  private @Nullable Object mObject;

  public DynamicFromObject(@Nullable Object obj) {
    mObject = obj;
  }

  @Override
  public void recycle() {
    // Noop - nothing to recycle since there is no pooling
  }

  @Override
  public boolean isNull() {
    return mObject == null;
  }

  @Override
  public boolean asBoolean() {
    return (boolean)mObject;
  }

  @Override
  public double asDouble() {
    return (double)mObject;
  }

  @Override
  public int asInt() {
    // Numbers from JS are always Doubles
    return ((Double)mObject).intValue();
  }

  @Override
  public String asString() {
    return (String)mObject;
  }

  @Override
  public ReadableArray asArray() {
    return (ReadableArray)mObject;
  }

  @Override
  public ReadableMap asMap() {
    return (ReadableMap)mObject;
  }

  @Override
  public ReadableType getType() {
    if (isNull()) {
      return ReadableType.Null;
    }
    if (mObject instanceof Boolean) {
      return ReadableType.Boolean;
    }
    if (mObject instanceof Number) {
      return ReadableType.Number;
    }
    if (mObject instanceof String) {
      return ReadableType.String;
    }
    if (mObject instanceof ReadableMap) {
      return ReadableType.Map;
    }
    if (mObject instanceof ReadableArray) {
      return ReadableType.Array;
    }
    FLog.e(ReactConstants.TAG, "Unmapped object type " + mObject.getClass().getName());
    return ReadableType.Null;
  }
}
