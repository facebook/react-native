/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<d231dc5fd873a05ae8641a7199502a2a>>

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
  public float flex;

  public Spacing margin = new Spacing();
  public Spacing padding = new Spacing();
  public Spacing border = new Spacing();

  public float[] position = new float[4];
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
    flex = 0f;

    margin.reset();;
    padding.reset();
    border.reset();

    Arrays.fill(position, CSSConstants.UNDEFINED);
    Arrays.fill(dimensions, CSSConstants.UNDEFINED);

    minWidth = CSSConstants.UNDEFINED;
    minHeight = CSSConstants.UNDEFINED;

    maxWidth = CSSConstants.UNDEFINED;
    maxHeight = CSSConstants.UNDEFINED;
  }
}
