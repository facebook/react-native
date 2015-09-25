/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<2fc400ad927a17e1b13430210531ce86>>

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

  public float[] position = {
      CSSConstants.UNDEFINED,
      CSSConstants.UNDEFINED,
      CSSConstants.UNDEFINED,
      CSSConstants.UNDEFINED,
  };

  public float[] dimensions = {
      CSSConstants.UNDEFINED,
      CSSConstants.UNDEFINED,
  };

  public float minWidth = CSSConstants.UNDEFINED;
  public float minHeight = CSSConstants.UNDEFINED;

  public float maxWidth = CSSConstants.UNDEFINED;
  public float maxHeight = CSSConstants.UNDEFINED;
}
