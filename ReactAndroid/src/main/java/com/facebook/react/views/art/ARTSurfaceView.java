/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import javax.annotation.Nullable;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;

/**
 * Custom {@link View} implementation that draws an ARTSurface React view and its children.
 */
public class ARTSurfaceView extends View {

  private @Nullable Bitmap mBitmap;

  public ARTSurfaceView(Context context) {
    super(context);
  }

  public void setBitmap(Bitmap bitmap) {
    if (mBitmap != null) {
      mBitmap.recycle();
    }
    mBitmap = bitmap;
    invalidate();
  }

  @Override
  protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);
    if (mBitmap != null) {
      canvas.drawBitmap(mBitmap, 0, 0, null);
    }
  }
}
