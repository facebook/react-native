/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.content.Context;
import android.graphics.Canvas;
import android.view.ViewGroup;

/**
 * A view that FlatShadowNode hierarchy maps to. Performs drawing by iterating over
 * array of DrawCommands, executing them one by one.
 */
/* package */ final class FlatViewGroup extends ViewGroup {

  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;

  /* package */ FlatViewGroup(Context context) {
    super(context);
  }

  @Override
  public void dispatchDraw(Canvas canvas) {
    super.dispatchDraw(canvas);

    for (DrawCommand drawCommand : mDrawCommands) {
      drawCommand.draw(canvas);
    }
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // nothing to do here
  }

  /* package */ void mountDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
    invalidate();
  }
}
