/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<3177826257fea8b5ac1fc9d1d514935a>>

package com.facebook.csslayout;

import javax.annotation.Nullable;

import java.util.Arrays;

/**
 * Class representing CSS spacing (padding, margin, and borders). This is mostly necessary to
 * properly implement interactions and updates for properties like margin, marginLeft, and
 * marginHorizontal.
 */
public class Spacing {

  /**
   * Spacing type that represents the left direction. E.g. {@code marginLeft}.
   */
  public static final int LEFT = 0;
  /**
   * Spacing type that represents the top direction. E.g. {@code marginTop}.
   */
  public static final int TOP = 1;
  /**
   * Spacing type that represents the right direction. E.g. {@code marginRight}.
   */
  public static final int RIGHT = 2;
  /**
   * Spacing type that represents the bottom direction. E.g. {@code marginBottom}.
   */
  public static final int BOTTOM = 3;
  /**
   * Spacing type that represents vertical direction (top and bottom). E.g. {@code marginVertical}.
   */
  public static final int VERTICAL = 4;
  /**
   * Spacing type that represents horizontal direction (left and right). E.g.
   * {@code marginHorizontal}.
   */
  public static final int HORIZONTAL = 5;
  /**
   * Spacing type that represents start direction e.g. left in left-to-right, right in right-to-left.
   */
  public static final int START = 6;
  /**
   * Spacing type that represents end direction e.g. right in left-to-right, left in right-to-left.
   */
  public static final int END = 7;
  /**
   * Spacing type that represents all directions (left, top, right, bottom). E.g. {@code margin}.
   */
  public static final int ALL = 8;

  private static final int[] sFlagsMap = {
    1, /*LEFT*/
    2, /*TOP*/
    4, /*RIGHT*/
    8, /*BOTTOM*/
    16, /*VERTICAL*/
    32, /*HORIZONTAL*/
    64, /*START*/
    128, /*END*/
    256, /*ALL*/
  };

  private final float[] mSpacing = newFullSpacingArray();
  @Nullable private float[] mDefaultSpacing = null;
  private int mValueFlags = 0;
  private boolean mHasAliasesSet;

  /**
   * Set a spacing value.
   *
   * @param spacingType one of {@link #LEFT}, {@link #TOP}, {@link #RIGHT}, {@link #BOTTOM},
   *        {@link #VERTICAL}, {@link #HORIZONTAL}, {@link #ALL}
   * @param value the value for this direction
   * @return {@code true} if the spacing has changed, or {@code false} if the same value was already
   *         set
   */
  public boolean set(int spacingType, float value) {
    if (!FloatUtil.floatsEqual(mSpacing[spacingType], value)) {
      mSpacing[spacingType] = value;

      if (CSSConstants.isUndefined(value)) {
        mValueFlags &= ~sFlagsMap[spacingType];
      } else {
        mValueFlags |= sFlagsMap[spacingType];
      }

      mHasAliasesSet =
          (mValueFlags & sFlagsMap[ALL]) != 0 ||
          (mValueFlags & sFlagsMap[VERTICAL]) != 0 ||
          (mValueFlags & sFlagsMap[HORIZONTAL]) != 0;

      return true;
    }
    return false;
  }

  /**
   * Set a default spacing value. This is used as a fallback when no spacing has been set for a
   * particular direction.
   *
   * @param spacingType one of {@link #LEFT}, {@link #TOP}, {@link #RIGHT}, {@link #BOTTOM}
   * @param value the default value for this direction
   * @return
   */
  public boolean setDefault(int spacingType, float value) {
    if (mDefaultSpacing == null) {
      mDefaultSpacing = newSpacingResultArray();
    }
    if (!FloatUtil.floatsEqual(mDefaultSpacing[spacingType], value)) {
      mDefaultSpacing[spacingType] = value;
      return true;
    }
    return false;
  }

  /**
   * Get the spacing for a direction. This takes into account any default values that have been set.
   *
   * @param spacingType one of {@link #LEFT}, {@link #TOP}, {@link #RIGHT}, {@link #BOTTOM}
   */
  public float get(int spacingType) {
    float defaultValue = (mDefaultSpacing != null)
        ? mDefaultSpacing[spacingType]
        : (spacingType == START || spacingType == END ? CSSConstants.UNDEFINED : 0);

    if (mValueFlags == 0) {
      return defaultValue;
    }

    if ((mValueFlags & sFlagsMap[spacingType]) != 0) {
      return mSpacing[spacingType];
    }

    if (mHasAliasesSet) {
      int secondType = spacingType == TOP || spacingType == BOTTOM ? VERTICAL : HORIZONTAL;
      if ((mValueFlags & sFlagsMap[secondType]) != 0) {
        return mSpacing[secondType];
      } else if ((mValueFlags & sFlagsMap[ALL]) != 0) {
        return mSpacing[ALL];
      }
    }

    return defaultValue;
  }

  /**
   * Get the raw value (that was set using {@link #set(int, float)}), without taking into account
   * any default values.
   *
   * @param spacingType one of {@link #LEFT}, {@link #TOP}, {@link #RIGHT}, {@link #BOTTOM},
   *        {@link #VERTICAL}, {@link #HORIZONTAL}, {@link #ALL}
   */
  public float getRaw(int spacingType) {
    return mSpacing[spacingType];
  }

  /**
   * Resets the spacing instance to its default state. This method is meant to be used when
   * recycling {@link Spacing} instances.
   */
  void reset() {
    Arrays.fill(mSpacing, CSSConstants.UNDEFINED);
    mDefaultSpacing = null;
    mHasAliasesSet = false;
    mValueFlags = 0;
  }

  /**
   * Try to get start value and fallback to given type if not defined. This is used privately
   * by the layout engine as a more efficient way to fetch direction-aware values by
   * avoid extra method invocations.
   */
  float getWithFallback(int spacingType, int fallbackType) {
    return
        (mValueFlags & sFlagsMap[spacingType]) != 0
            ? mSpacing[spacingType]
            : get(fallbackType);
  }

  private static float[] newFullSpacingArray() {
    return new float[] {
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
    };
  }

  private static float[] newSpacingResultArray() {
    return newSpacingResultArray(0);
  }

  private static float[] newSpacingResultArray(float defaultValue) {
    return new float[] {
        defaultValue,
        defaultValue,
        defaultValue,
        defaultValue,
        defaultValue,
        defaultValue,
        CSSConstants.UNDEFINED,
        CSSConstants.UNDEFINED,
        defaultValue,
    };
  }
}
