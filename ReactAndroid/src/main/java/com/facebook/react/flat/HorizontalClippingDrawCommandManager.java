/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/**
 * {@link DrawCommandManager} with horizontal clipping (The view scrolls left and right).
 */
/* package */ final class HorizontalClippingDrawCommandManager extends
    DirectionalClippingDrawCommandManager {

  /* package */ HorizontalClippingDrawCommandManager(
      FlatViewGroup flatViewGroup,
      DrawCommand[] drawCommands) {
    super(flatViewGroup, drawCommands);
  }

  @Override
  public boolean beforeRect(DrawView drawView) {
    return drawView.mLogicalRight <= mClippingRect.left;
  }

  @Override
  public boolean afterRect(DrawView drawView) {
    return drawView.mLogicalLeft >= mClippingRect.right;
  }
}
