/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.graphics.Typeface;
import android.os.Build;
import com.facebook.infer.annotation.Nullsafe;

/** Responsible for normalizing style and numeric weight for backward compatibility. */
@Nullsafe(Nullsafe.Mode.LOCAL)
class TypefaceStyle {

  public static final int BOLD = 700;
  public static final int NORMAL = 400;

  private static final int MIN_WEIGHT = 1;
  private static final int MAX_WEIGHT = 1000;

  private final boolean mItalic;
  private final int mWeight;

  public TypefaceStyle(int weight, boolean italic) {
    mItalic = italic;
    mWeight = weight == ReactBaseTextShadowNode.UNSET ? NORMAL : weight;
  }

  public TypefaceStyle(int style) {
    if (style == ReactBaseTextShadowNode.UNSET) {
      style = Typeface.NORMAL;
    }

    mItalic = (style & Typeface.ITALIC) != 0;
    mWeight = (style & Typeface.BOLD) != 0 ? BOLD : NORMAL;
  }

  /**
   * If `weight` is supplied, it will be combined with the italic bit from `style`. Otherwise, any
   * existing weight bit in `style` will be used.
   */
  public TypefaceStyle(int style, int weight) {
    if (style == ReactBaseTextShadowNode.UNSET) {
      style = Typeface.NORMAL;
    }

    mItalic = (style & Typeface.ITALIC) != 0;
    mWeight =
        weight == ReactBaseTextShadowNode.UNSET
            ? (style & Typeface.BOLD) != 0 ? BOLD : NORMAL
            : weight;
  }

  public int getNearestStyle() {
    if (mWeight < BOLD) {
      return mItalic ? Typeface.ITALIC : Typeface.NORMAL;
    } else {
      return mItalic ? Typeface.BOLD_ITALIC : Typeface.BOLD;
    }
  }

  public Typeface apply(Typeface typeface) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      return Typeface.create(typeface, getNearestStyle());
    } else {
      return Typeface.create(typeface, mWeight, mItalic);
    }
  }
}
