/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class YogaNodeJNI extends YogaNodeJNIBase {

  @DoNotStrip
  private float mWidth = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mHeight = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mTop = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mLeft = YogaConstants.UNDEFINED;
  @DoNotStrip
  private float mMarginLeft = 0;
  @DoNotStrip
  private float mMarginTop = 0;
  @DoNotStrip
  private float mMarginRight = 0;
  @DoNotStrip
  private float mMarginBottom = 0;
  @DoNotStrip
  private float mPaddingLeft = 0;
  @DoNotStrip
  private float mPaddingTop = 0;
  @DoNotStrip
  private float mPaddingRight = 0;
  @DoNotStrip
  private float mPaddingBottom = 0;
  @DoNotStrip
  private float mBorderLeft = 0;
  @DoNotStrip
  private float mBorderTop = 0;
  @DoNotStrip
  private float mBorderRight = 0;
  @DoNotStrip
  private float mBorderBottom = 0;
  @DoNotStrip
  private int mLayoutDirection = 0;
  @DoNotStrip
  private boolean mHasNewLayout = true;
  @DoNotStrip
  private boolean mDoesLegacyStretchFlagAffectsLayout = false;

  public YogaNodeJNI() {
    super();
  }

  public YogaNodeJNI(YogaConfig config) {
    super(config);
  }

  @Override
  public void reset() {
    super.reset();
    mHasNewLayout = true;

    mWidth = YogaConstants.UNDEFINED;
    mHeight = YogaConstants.UNDEFINED;
    mTop = YogaConstants.UNDEFINED;
    mLeft = YogaConstants.UNDEFINED;
    mMarginLeft = 0;
    mMarginTop = 0;
    mMarginRight = 0;
    mMarginBottom = 0;
    mPaddingLeft = 0;
    mPaddingTop = 0;
    mPaddingRight = 0;
    mPaddingBottom = 0;
    mBorderLeft = 0;
    mBorderTop = 0;
    mBorderRight = 0;
    mBorderBottom = 0;
    mLayoutDirection = 0;

    mDoesLegacyStretchFlagAffectsLayout = false;
  }

  @Override
  public boolean hasNewLayout() {
    return mHasNewLayout;
  }

  @Override
  public void markLayoutSeen() {
    mHasNewLayout = false;
  }

  @Override
  public float getLayoutX() {
    return mLeft;
  }

  @Override
  public float getLayoutY() {
    return mTop;
  }

  @Override
  public float getLayoutWidth() {
    return mWidth;
  }

  @Override
  public float getLayoutHeight() {
    return mHeight;
  }

  @Override
  public boolean getDoesLegacyStretchFlagAffectsLayout() {
    return mDoesLegacyStretchFlagAffectsLayout;
  }

  @Override
  public float getLayoutMargin(YogaEdge edge) {
    switch (edge) {
      case LEFT:
        return mMarginLeft;
      case TOP:
        return mMarginTop;
      case RIGHT:
        return mMarginRight;
      case BOTTOM:
        return mMarginBottom;
      case START:
        return getLayoutDirection() == YogaDirection.RTL ? mMarginRight : mMarginLeft;
      case END:
        return getLayoutDirection() == YogaDirection.RTL ? mMarginLeft : mMarginRight;
      default:
        throw new IllegalArgumentException("Cannot get layout margins of multi-edge shorthands");
    }
  }

  @Override
  public float getLayoutPadding(YogaEdge edge) {
    switch (edge) {
      case LEFT:
        return mPaddingLeft;
      case TOP:
        return mPaddingTop;
      case RIGHT:
        return mPaddingRight;
      case BOTTOM:
        return mPaddingBottom;
      case START:
        return getLayoutDirection() == YogaDirection.RTL ? mPaddingRight : mPaddingLeft;
      case END:
        return getLayoutDirection() == YogaDirection.RTL ? mPaddingLeft : mPaddingRight;
      default:
        throw new IllegalArgumentException("Cannot get layout paddings of multi-edge shorthands");
    }
  }

  @Override
  public float getLayoutBorder(YogaEdge edge) {
    switch (edge) {
      case LEFT:
        return mBorderLeft;
      case TOP:
        return mBorderTop;
      case RIGHT:
        return mBorderRight;
      case BOTTOM:
        return mBorderBottom;
      case START:
        return getLayoutDirection() == YogaDirection.RTL ? mBorderRight : mBorderLeft;
      case END:
        return getLayoutDirection() == YogaDirection.RTL ? mBorderLeft : mBorderRight;
      default:
        throw new IllegalArgumentException("Cannot get layout border of multi-edge shorthands");
    }
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.fromInt(mLayoutDirection);
  }
}
