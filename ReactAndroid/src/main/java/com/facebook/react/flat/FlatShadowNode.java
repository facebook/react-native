/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ViewProps;

/**
 * FlatShadowNode is a base class for all shadow node used in FlatUIImplementation. It extends
 * {@link LayoutShadowNode} by adding an ability to prepare DrawCommands off the UI thread.
 */
/* package */ class FlatShadowNode extends LayoutShadowNode {

  private @Nullable DrawBackgroundColor mDrawBackground;

  /**
   * Collects DrawCommands produced by this FlatShadoNode.
   */
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom) {
    if (mDrawBackground != null) {
      mDrawBackground = (DrawBackgroundColor) mDrawBackground.updateBoundsAndFreeze(
          left,
          top,
          right,
          bottom);
      stateBuilder.addDrawCommand(mDrawBackground);
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  public void setBackgroundColor(int backgroundColor) {
    mDrawBackground = (backgroundColor == 0) ? null : new DrawBackgroundColor(backgroundColor);
    invalidate();
  }

  /**
   * Marks root node as updated to trigger a StateBuilder pass to collect DrawCommands for the node
   * tree. Use it when FlatShadowNode is updated but doesn't require a layout pass (e.g. background
   * color is changed).
   */
  protected final void invalidate() {
    // getRootNode() returns an ReactShadowNode, which is guarantied to be a FlatRootShadowNode.
    FlatRootShadowNode rootNode = (FlatRootShadowNode) getRootNode();
    rootNode.markUpdated(true);
  }
}
