/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

import java.util.Arrays;

/**
 * The CSS style definition for a {@link CSSNode}.
 */
public class CSSStyle {

  public CSSDirection direction;
  public CSSFlexDirection flexDirection;
  public CSSJustify justifyContent;
  public CSSAlign alignContent;
  public CSSAlign alignItems;
  public CSSAlign alignSelf;
  public CSSPositionType positionType;
  public CSSWrap flexWrap;
  public CSSOverflow overflow;
  public float flexGrow;
  public float flexShrink;
  public float flexBasis;

  public Spacing margin = new Spacing();
  public Spacing padding = new Spacing();
  public Spacing border = new Spacing();
  public Spacing position = new Spacing(CSSConstants.UNDEFINED);

  public float[] dimensions = new float[2];

  public float minWidth = CSSConstants.UNDEFINED;
  public float minHeight = CSSConstants.UNDEFINED;

  public float maxWidth = CSSConstants.UNDEFINED;
  public float maxHeight = CSSConstants.UNDEFINED;

  CSSStyle() {
    reset();
  }

  void reset() {
    direction = CSSDirection.INHERIT;
    flexDirection = CSSFlexDirection.COLUMN;
    justifyContent = CSSJustify.FLEX_START;
    alignContent = CSSAlign.FLEX_START;
    alignItems = CSSAlign.STRETCH;
    alignSelf = CSSAlign.AUTO;
    positionType = CSSPositionType.RELATIVE;
    flexWrap = CSSWrap.NOWRAP;
    overflow = CSSOverflow.VISIBLE;
    flexGrow = 0;
    flexShrink = 0;
    flexBasis = CSSConstants.UNDEFINED;

    margin.reset();
    padding.reset();
    border.reset();
    position.reset();

    Arrays.fill(dimensions, CSSConstants.UNDEFINED);

    minWidth = CSSConstants.UNDEFINED;
    minHeight = CSSConstants.UNDEFINED;

    maxWidth = CSSConstants.UNDEFINED;
    maxHeight = CSSConstants.UNDEFINED;
  }
}
