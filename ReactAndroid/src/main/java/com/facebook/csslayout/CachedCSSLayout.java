/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<e2f8139d4c50e4d2a9281a4587f8c095>>

package com.facebook.csslayout;

/**
 * CSSLayout with additional information about the conditions under which it was generated.
 * {@link #requestedWidth} and {@link #requestedHeight} are the width and height the parent set on
 * this node before calling layout visited us.
 */
public class CachedCSSLayout extends CSSLayout {

  public float requestedWidth = CSSConstants.UNDEFINED;
  public float requestedHeight = CSSConstants.UNDEFINED;
  public float parentMaxWidth = CSSConstants.UNDEFINED;
  public float parentMaxHeight = CSSConstants.UNDEFINED;
}
