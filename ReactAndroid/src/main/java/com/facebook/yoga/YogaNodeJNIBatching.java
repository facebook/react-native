/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import javax.annotation.Nullable;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class YogaNodeJNIBatching extends YogaNodeJNIBase {

  /* Those flags needs be in sync with YGJNI.cpp */
  private static final byte MARGIN = 1;
  private static final byte PADDING = 2;
  private static final byte BORDER = 4;
  private static final byte DOES_LEGACY_STRETCH_BEHAVIOUR = 8;
  private static final byte HAS_NEW_LAYOUT = 16;

  private static final byte LAYOUT_EDGE_SET_FLAG_INDEX = 0;
  private static final byte LAYOUT_WIDTH_INDEX = 1;
  private static final byte LAYOUT_HEIGHT_INDEX = 2;
  private static final byte LAYOUT_LEFT_INDEX = 3;
  private static final byte LAYOUT_TOP_INDEX = 4;
  private static final byte LAYOUT_DIRECTION_INDEX = 5;
  private static final byte LAYOUT_MARGIN_START_INDEX = 6;
  private static final byte LAYOUT_PADDING_START_INDEX = 10;
  private static final byte LAYOUT_BORDER_START_INDEX = 14;

  @DoNotStrip
  private @Nullable float[] arr = null;

  @DoNotStrip
  private int mLayoutDirection = 0;

  private boolean mHasNewLayout = true;

  public YogaNodeJNIBatching() {
    super();
  }

  public YogaNodeJNIBatching(YogaConfig config) {
    super(config);
  }

  @Override
  public void reset() {
    super.reset();
    arr = null;
    mHasNewLayout = true;
    mLayoutDirection = 0;
  }

  @Override
  public float getLayoutX() {
    return arr != null ? arr[LAYOUT_LEFT_INDEX] : 0;
  }

  @Override
  public float getLayoutY() {
    return arr != null ? arr[LAYOUT_TOP_INDEX] : 0;
  }

  @Override
  public float getLayoutWidth() {
    return arr != null ? arr[LAYOUT_WIDTH_INDEX] : 0;
  }

  @Override
  public float getLayoutHeight() {
    return arr != null ? arr[LAYOUT_HEIGHT_INDEX] : 0;
  }

  @Override
  public boolean getDoesLegacyStretchFlagAffectsLayout() {
    return arr != null && (((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & DOES_LEGACY_STRETCH_BEHAVIOUR) == DOES_LEGACY_STRETCH_BEHAVIOUR);
  }

  @Override
  public float getLayoutMargin(YogaEdge edge) {
    if (arr != null && ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) {
      switch (edge) {
        case LEFT:
          return arr[LAYOUT_MARGIN_START_INDEX];
        case TOP:
          return arr[LAYOUT_MARGIN_START_INDEX + 1];
        case RIGHT:
          return arr[LAYOUT_MARGIN_START_INDEX + 2];
        case BOTTOM:
          return arr[LAYOUT_MARGIN_START_INDEX + 3];
        case START:
          return getLayoutDirection() == YogaDirection.RTL ? arr[LAYOUT_MARGIN_START_INDEX + 2] : arr[LAYOUT_MARGIN_START_INDEX];
        case END:
          return getLayoutDirection() == YogaDirection.RTL ? arr[LAYOUT_MARGIN_START_INDEX] : arr[LAYOUT_MARGIN_START_INDEX + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout margins of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public float getLayoutPadding(YogaEdge edge) {
    if (arr != null && ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & PADDING) == PADDING) {
      int paddingStartIndex = LAYOUT_PADDING_START_INDEX - ((((int)arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) ? 0 : 4);
      switch (edge) {
        case LEFT:
          return arr[paddingStartIndex];
        case TOP:
          return arr[paddingStartIndex + 1];
        case RIGHT:
          return arr[paddingStartIndex + 2];
        case BOTTOM:
          return arr[paddingStartIndex + 3];
        case START:
          return getLayoutDirection() == YogaDirection.RTL ? arr[paddingStartIndex + 2] : arr[paddingStartIndex];
        case END:
          return getLayoutDirection() == YogaDirection.RTL ? arr[paddingStartIndex] : arr[paddingStartIndex + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout paddings of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public float getLayoutBorder(YogaEdge edge) {
    if (arr != null && ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & BORDER) == BORDER) {
      int borderStartIndex = LAYOUT_BORDER_START_INDEX - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) ? 0 : 4) - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & PADDING) == PADDING) ? 0 : 4);
      switch (edge) {
        case LEFT:
          return arr[borderStartIndex];
        case TOP:
          return arr[borderStartIndex + 1];
        case RIGHT:
          return arr[borderStartIndex + 2];
        case BOTTOM:
          return arr[borderStartIndex + 3];
        case START:
          return getLayoutDirection() == YogaDirection.RTL ? arr[borderStartIndex + 2] : arr[borderStartIndex];
        case END:
          return getLayoutDirection() == YogaDirection.RTL ? arr[borderStartIndex] : arr[borderStartIndex + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout border of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.fromInt(arr != null ? (int) arr[LAYOUT_DIRECTION_INDEX] : mLayoutDirection);
  }

  @Override
  public boolean hasNewLayout() {
    if (arr != null) {
      return (((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX]) & HAS_NEW_LAYOUT) == HAS_NEW_LAYOUT;
    } else {
      return mHasNewLayout;
    }
  }

  @Override
  public void markLayoutSeen() {
    if (arr != null) {
      arr[LAYOUT_EDGE_SET_FLAG_INDEX] = ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX]) & ~(HAS_NEW_LAYOUT);
    }
    mHasNewLayout = false;
  }
}
