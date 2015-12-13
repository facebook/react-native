/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.graphics.Canvas;

/* package */ final class DrawView implements DrawCommand {

  /* package */ static DrawView INSTANCE = new DrawView();

  private DrawView() {}

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    parent.drawNextChild(canvas);
  }
}
