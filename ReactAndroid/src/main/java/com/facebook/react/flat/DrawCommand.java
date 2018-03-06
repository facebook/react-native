/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import android.graphics.Canvas;

/**
 * DrawCommand is an interface that shadow nodes need to implement to do the drawing.
 * Instances of DrawCommand are created in background thread and passed to UI thread.
 * Once a DrawCommand is shared with UI thread, it can no longer be mutated in background thread.
 */
public abstract class DrawCommand {
  // used by StateBuilder, FlatViewGroup and FlatShadowNode
  /* package */ static final DrawCommand[] EMPTY_ARRAY = new DrawCommand[0];

  /**
   * Performs drawing into the given canvas.
   *
   * @param parent The parent to get child information from, if needed
   * @param canvas The canvas to draw into
   */
  abstract void draw(FlatViewGroup parent, Canvas canvas);

  /**
   * Performs debug bounds drawing into the given canvas.
   *
   * @param parent The parent to get child information from, if needed
   * @param canvas The canvas to draw into
   */
  abstract void debugDraw(FlatViewGroup parent, Canvas canvas);

  abstract float getLeft();

  abstract float getTop();

  abstract float getRight();

  abstract float getBottom();
}
