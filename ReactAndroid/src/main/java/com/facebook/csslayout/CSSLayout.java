/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<af6ef8054f37d4745903e857b95fe01f>>

package com.facebook.csslayout;

import java.util.Arrays;

/**
 * Where the output of {@link LayoutEngine#layoutNode(CSSNode, float)} will go in the CSSNode.
 */
public class CSSLayout {
  // This value was chosen based on empiracle data. Even the most complicated
  // layouts should not require more than 16 entries to fit within the cache.
  public static final int MAX_CACHED_RESULT_COUNT = 16;

  public static final int POSITION_LEFT = 0;
  public static final int POSITION_TOP = 1;
  public static final int POSITION_RIGHT = 2;
  public static final int POSITION_BOTTOM = 3;

  public static final int DIMENSION_WIDTH = 0;
  public static final int DIMENSION_HEIGHT = 1;

  public float[] position = new float[4];
  public float[] dimensions = new float[2];
  public CSSDirection direction = CSSDirection.LTR;

  public float flexBasis;

  public int generationCount;
  public CSSDirection lastParentDirection;

  public int nextCachedMeasurementsIndex;
  public CSSCachedMeasurement[] cachedMeasurements = new CSSCachedMeasurement[MAX_CACHED_RESULT_COUNT];
  public float[] measuredDimensions = new float[2];

  public CSSCachedMeasurement cachedLayout = new CSSCachedMeasurement();

  CSSLayout() {
    resetResult();
  }

  public void resetResult() {
    Arrays.fill(position, 0);
    Arrays.fill(dimensions, CSSConstants.UNDEFINED);
    direction = CSSDirection.LTR;

    flexBasis = 0;

    generationCount = 0;
    lastParentDirection = null;

    nextCachedMeasurementsIndex = 0;
    measuredDimensions[DIMENSION_WIDTH] = CSSConstants.UNDEFINED;
    measuredDimensions[DIMENSION_HEIGHT] = CSSConstants.UNDEFINED;

    cachedLayout.widthMeasureMode = null;
    cachedLayout.heightMeasureMode = null;
  }

  @Override
  public String toString() {
    return "layout: {" +
        "left: " + position[POSITION_LEFT] + ", " +
        "top: " + position[POSITION_TOP] + ", " +
        "width: " + dimensions[DIMENSION_WIDTH] + ", " +
        "height: " + dimensions[DIMENSION_HEIGHT] + ", " +
        "direction: " + direction +
        "}";
  }
}
