/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import java.nio.ByteBuffer;

@DoNotStrip
/* package */ final class YogaNodeMemoryLayout {

  private static final int FLOAT_SIZE = 4;
  private static final int INT_SIZE = 4;
  private static final int VALUE_SIZE = FLOAT_SIZE + INT_SIZE;
  private static final byte FALSE = 0;
  private static final byte TRUE = 1;
  private static final int AUTO = YogaUnit.AUTO.intValue();
  private static final int POINT = YogaUnit.POINT.intValue();
  private static final int PERCENT = YogaUnit.PERCENT.intValue();
  private static final int UNDEFINED = YogaUnit.UNDEFINED.intValue();

  // TODO(davidaurelio) code-gen these values
  static final int styleDirection = 0;
  static final int styleFlexDirection = 4;
  static final int styleJustifyContent = 8;
  static final int styleAlignContent = 12;
  static final int styleAlignItems = 16;
  static final int styleAlignSelf = 20;
  static final int stylePositionType = 24;
  static final int styleFlexWrap = 28;
  static final int styleOverflow = 32;
  static final int styleDisplay = 36;
  static final int styleFlex = 40;
  static final int styleFlexGrow = 48;
  static final int styleFlexShrink = 56;
  static final int styleFlexBasis = 64;
  static final int styleMargin = 72;
  static final int stylePosition = 144;
  static final int stylePadding = 216;
  static final int styleBorder = 288;
  static final int styleDimensions = 360;
  static final int styleMinDimensions = 376;
  static final int styleMaxDimensions = 392;
  static final int styleAspectRatio = 408;

  static final int styleWidth = styleDimensions;
  static final int styleHeight = styleDimensions + VALUE_SIZE;
  static final int styleMinWidth = styleMinDimensions;
  static final int styleMinHeight = styleMinDimensions + VALUE_SIZE;
  static final int styleMaxWidth = styleMaxDimensions;
  static final int styleMaxHeight = styleMaxDimensions + VALUE_SIZE;

  static final int layoutPosition = 0;
  static final int layoutDimensions = 16;
  static final int layoutMargin = 24;
  static final int layoutBorder = 48;
  static final int layoutPadding = 72;
  static final int layoutDirection = 96;
  static final int layoutComputedFlexBasisGeneration = 100;
  static final int layoutComputedFlexBasis = 104;
  static final int layoutHadOverflow = 112;
  static final int layoutGenerationCount = 116;
  static final int layoutLastOwnerDirection = 120;
  static final int layoutNextCachedMeasurementsIndex = 124;
  static final int layoutCachedMeasurements = 128;
  static final int layoutMeasuredDimensions = 512;
  static final int layoutCachedLayout = 520;
  static final int layoutDidUseLegacyFlag = 544;
  static final int layoutDoesLegacyStretchFlagAffectsLayout = 545;

  static final int layoutX = layoutPosition;
  static final int layoutY = layoutPosition + FLOAT_SIZE;
  static final int layoutWidth = layoutDimensions;
  static final int layoutHeight = layoutDimensions + FLOAT_SIZE;

  static int stylePositionOffset(YogaEdge edge) {
    return stylePosition + edge.intValue() * VALUE_SIZE;
  }

  static int styleMarginOffset(YogaEdge edge) {
    return styleMargin + edge.intValue() * VALUE_SIZE;
  }

  static int layoutMarginOffset(YogaEdge edge) {
    return layoutMargin + edge.intValue() * FLOAT_SIZE;
  }

  static int stylePaddingOffset(YogaEdge edge) {
    return stylePadding + edge.intValue() * VALUE_SIZE;
  }

  static int layoutPaddingOffset(YogaEdge edge) {
    return layoutPadding + edge.intValue() * FLOAT_SIZE;
  }

  static int styleBorderOffset(YogaEdge edge) {
    return styleBorder + edge.intValue() * VALUE_SIZE;
  }

  static int layoutBorderOffset(YogaEdge edge) {
    return layoutBorder + edge.intValue() * FLOAT_SIZE;
  }

  static void putOptional(ByteBuffer buffer, int offset, float value) {
    buffer.putFloat(offset, value);
    buffer.put(
        offset + FLOAT_SIZE, YogaConstants.isUndefined(value) ? TRUE : FALSE); // bool isUndefined_
  }

  static float getOptional(ByteBuffer buffer, int offset) {
    return getBoolean(buffer, offset + FLOAT_SIZE)
        ? YogaConstants.UNDEFINED
        : buffer.getFloat(offset);
  }

  private static void putValue(ByteBuffer buffer, int offset, float value, int unit) {
    if (YogaConstants.isUndefined(value)) {
      value = YogaConstants.UNDEFINED;
      unit = UNDEFINED;
    }
    buffer.putFloat(offset, value);
    buffer.putInt(offset + FLOAT_SIZE, unit);
  }

  static void putAutoValue(ByteBuffer buffer, int offset) {
    putValue(buffer, offset, 0, AUTO);
  }

  static void putPointValue(ByteBuffer buffer, int offset, float value) {
    putValue(buffer, offset, value, POINT);
  }

  static void putPercentValue(ByteBuffer buffer, int offset, float value) {
    putValue(buffer, offset, value, PERCENT);
  }

  static YogaValue getValue(ByteBuffer buffer, int offset) {
    float value = buffer.getFloat(offset);
    int unit = buffer.getInt(offset + FLOAT_SIZE);
    return new YogaValue(value, YogaUnit.fromInt(unit));
  }

  static boolean getBoolean(ByteBuffer buffer, int offset) {
    return buffer.get(offset) != 0;
  }
}
