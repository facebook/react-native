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
 * {@link DrawCommandManager} with vertical clipping (The view scrolls up and down).
 */
/* package */ final class VerticalClippingDrawCommandManager extends
    DirectionalClippingDrawCommandManager {

  /* package */ VerticalClippingDrawCommandManager(
      FlatViewGroup flatViewGroup,
      DrawCommand[] drawCommands) {
    super(flatViewGroup, drawCommands);
  }

  @Override
  boolean beforeRect(DrawView drawView) {
    return drawView.mLogicalBottom <= mClippingRect.top;
  }

  @Override
  boolean afterRect(DrawView drawView) {
    return drawView.mLogicalTop >= mClippingRect.bottom;
  }
}
