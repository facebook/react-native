/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<ec76950a22dda1c6e98eafc15ccf7cd3>>

package com.facebook.csslayout;

/**
 * The CSS style definition for a {@link CSSNode}.
 */
public class CSSStyle {

  public CSSDirection direction = CSSDirection.INHERIT;
  public CSSFlexDirection flexDirection = CSSFlexDirection.COLUMN;
  public CSSJustify justifyContent = CSSJustify.FLEX_START;
  public CSSAlign alignContent = CSSAlign.FLEX_START;
  public CSSAlign alignItems = CSSAlign.STRETCH;
  public CSSAlign alignSelf = CSSAlign.AUTO;
  public CSSPositionType positionType = CSSPositionType.RELATIVE;
  public CSSWrap flexWrap = CSSWrap.NOWRAP;
  public float flex;

  public Spacing margin = new Spacing();
  public Spacing padding = new Spacing();
  public Spacing border = new Spacing();

  public float positionTop = CSSConstants.UNDEFINED;
  public float positionBottom = CSSConstants.UNDEFINED;
  public float positionLeft = CSSConstants.UNDEFINED;
  public float positionRight = CSSConstants.UNDEFINED;

  public float width = CSSConstants.UNDEFINED;
  public float height = CSSConstants.UNDEFINED;

  public float minWidth = CSSConstants.UNDEFINED;
  public float minHeight = CSSConstants.UNDEFINED;

  public float maxWidth = CSSConstants.UNDEFINED;
  public float maxHeight = CSSConstants.UNDEFINED;
}
