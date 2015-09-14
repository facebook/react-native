/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<153b6759d2dd8fe8cf6d58a422450b96>>

package com.facebook.csslayout;

/**
 * Where the output of {@link LayoutEngine#layoutNode(CSSNode, float)} will go in the CSSNode.
 */
public class CSSLayout {

  public float top;
  public float left;
  public float right;
  public float bottom;
  public float width = CSSConstants.UNDEFINED;
  public float height = CSSConstants.UNDEFINED;
  public CSSDirection direction = CSSDirection.LTR;

  /**
   * This should always get called before calling {@link LayoutEngine#layoutNode(CSSNode, float)}
   */
  public void resetResult() {
    left = 0;
    top = 0;
    right = 0;
    bottom = 0;
    width = CSSConstants.UNDEFINED;
    height = CSSConstants.UNDEFINED;
    direction = CSSDirection.LTR;
  }

  public void copy(CSSLayout layout) {
    left = layout.left;
    top = layout.top;
    right = layout.right;
    bottom = layout.bottom;
    width = layout.width;
    height = layout.height;
    direction = layout.direction;
  }

  @Override
  public String toString() {
    return "layout: {" +
        "left: " + left + ", " +
        "top: " + top + ", " +
        "width: " + width + ", " +
        "height: " + height +
        "direction: " + direction +
        "}";
  }
}
