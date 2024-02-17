/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.debuggingoverlay;

import android.graphics.RectF;
import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public final class TraceUpdate {

  private final int mId;
  private final int mColor;
  private final RectF mRectangle;

  public TraceUpdate(int id, RectF rectangle, int color) {
    mId = id;
    mRectangle = rectangle;
    mColor = color;
  }

  public int getId() {
    return mId;
  }

  public int getColor() {
    return mColor;
  }

  public RectF getRectangle() {
    return mRectangle;
  }
}
