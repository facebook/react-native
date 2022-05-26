/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Looper;
import android.widget.FrameLayout;
import androidx.annotation.Nullable;

/**
 * A FrameLayout that allows you to access the result of the last time its hierarchy was drawn. It
 * accomplishes this by drawing its hierarchy into a software Canvas, saving the resulting Bitmap
 * and then drawing that Bitmap to the actual Canvas provided by the system.
 */
public class ScreenshotingFrameLayout extends FrameLayout {

  private @Nullable Bitmap mBitmap;
  private Canvas mCanvas;

  public ScreenshotingFrameLayout(Context context) {
    super(context);
    mCanvas = new Canvas();
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    if (mBitmap == null) {
      mBitmap = createNewBitmap(canvas);
      mCanvas.setBitmap(mBitmap);
    } else if (mBitmap.getWidth() != canvas.getWidth()
        || mBitmap.getHeight() != canvas.getHeight()) {
      mBitmap.recycle();
      mBitmap = createNewBitmap(canvas);
      mCanvas.setBitmap(mBitmap);
    }

    super.dispatchDraw(mCanvas);
    canvas.drawBitmap(mBitmap, 0, 0, null);
  }

  public void clean() {
    if (mBitmap != null) {
      mBitmap.recycle();
      mBitmap = null;
    }
    mCanvas.setBitmap(null);
  }

  private static Bitmap createNewBitmap(Canvas canvas) {
    return Bitmap.createBitmap(canvas.getWidth(), canvas.getHeight(), Bitmap.Config.ARGB_8888);
  }

  public Bitmap getLastDrawnBitmap() {
    if (mBitmap == null) {
      throw new RuntimeException("View has not been drawn yet!");
    }
    if (Looper.getMainLooper() != Looper.myLooper()) {
      throw new RuntimeException(
          "Must access screenshots from main thread or you may get partially drawn Bitmaps");
    }
    if (!isScreenshotReady()) {
      throw new RuntimeException("Trying to get screenshot, but the view is dirty or needs layout");
    }
    return Bitmap.createBitmap(mBitmap);
  }

  public boolean isScreenshotReady() {
    return !isDirty() && !isLayoutRequested();
  }
}
