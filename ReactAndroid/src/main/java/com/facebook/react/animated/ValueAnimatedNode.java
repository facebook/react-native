/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableMap;

import javax.annotation.Nullable;

/**
 * Basic type of animated node that maps directly from {@code Animated.Value(x)} of Animated.js
 * library.
 */
/*package*/ class ValueAnimatedNode extends AnimatedNode {
  /*package*/ double mValue = Double.NaN;
  /*package*/ double mOffset = 0;
  private @Nullable AnimatedNodeValueListener mValueListener;

  public ValueAnimatedNode() {
    // empty constructor that can be used by subclasses
  }

  public ValueAnimatedNode(ReadableMap config) {
    mValue = config.getDouble("value");
    mOffset = config.getDouble("offset");
  }

  public double getValue() {
    return mOffset + mValue;
  }

  public void flattenOffset() {
    mValue += mOffset;
    mOffset = 0;
  }

  public void onValueUpdate() {
    if (mValueListener == null) {
      return;
    }
    mValueListener.onValueUpdate(mValue);
  }

  public void setValueListener(@Nullable AnimatedNodeValueListener listener) {
    mValueListener = listener;
  }
}
