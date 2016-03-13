package com.facebook.react.uimanager;

import javax.annotation.Nullable;
import android.graphics.Bitmap;
import android.view.View;
import java.io.FileOutputStream;

public class Snapshot {

  Bitmap.CompressFormat format;
  double quality;
  Integer width;
  Integer height;

  public Snapshot(Bitmap.CompressFormat format, double quality, @Nullable Integer width, @Nullable Integer height) {
    this.format = format;
    this.quality = quality;
    this.width = width;
    this.height = height;
  }

  public void captureViewToFileOutputStream (View view, FileOutputStream out) {
    Bitmap bitmap = captureView(view);
    if (bitmap == null) {
      throw new RuntimeException("Impossible to snapshot the view");
    }
    bitmap.compress(format, (int)(100.0 * quality), out);
  }

  public Bitmap captureView (View view) {
    int w = view.getWidth();
    int h = view.getHeight();
    if (w <= 0 || h <= 0) return null;
    Bitmap bitmap = view.getDrawingCache();
    if (bitmap == null)
      view.setDrawingCacheEnabled(true);
    bitmap = view.getDrawingCache();
    if (width != null && height != null && (width != w || height != h)) {
      bitmap = Bitmap.createScaledBitmap(bitmap, width, height, true);
    }
    return bitmap;
  }
}
