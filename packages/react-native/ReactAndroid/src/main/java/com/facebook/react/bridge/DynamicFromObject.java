/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

/** Implementation of Dynamic wrapping a ReadableArray. */
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
    // NULLSAFE_FIXME[Nullable Dereference]
    return (boolean) mObject;
  }

  @Override
  public double asDouble() {
    // NULLSAFE_FIXME[Nullable Dereference]
    return (double) mObject;
  }

  @Override
  public int asInt() {
    // Numbers from JS are always Doubles
    // NULLSAFE_FIXME[Nullable Dereference]
    return ((Double) mObject).intValue();
  }

  @Override
  public String asString() {
    // NULLSAFE_FIXME[Return Not Nullable]
    return (String) mObject;
  }

  @Override
  public ReadableArray asArray() {
    // NULLSAFE_FIXME[Return Not Nullable]
    return (ReadableArray) mObject;
  }

  @Override
  public ReadableMap asMap() {
    // NULLSAFE_FIXME[Return Not Nullable]
    return (ReadableMap) mObject;
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
    FLog.e(
        ReactConstants.TAG,
        "Unmapped object type "
            + (mObject == null ? "<NULL object>" : mObject.getClass().getName()));
    return ReadableType.Null;
  }
}
