/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.traceupdateoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;
import androidx.annotation.UiThread;
import com.facebook.react.uimanager.PixelUtil;
import java.util.ArrayList;
import java.util.List;

public class TraceUpdateOverlay extends View {
  private final Paint mOverlayPaint = new Paint();
  private List<Overlay> mOverlays = new ArrayList<Overlay>();

  public static class Overlay {
    private final int mColor;
    private final RectF mRect;

    public Overlay(int color, RectF rect) {
      mColor = color;
      mRect = rect;
    }

    public int getColor() {
      return mColor;
    }

    public RectF getPixelRect() {
      return new RectF(
          PixelUtil.toPixelFromDIP(mRect.left),
          PixelUtil.toPixelFromDIP(mRect.top),
          PixelUtil.toPixelFromDIP(mRect.right),
          PixelUtil.toPixelFromDIP(mRect.bottom));
    }
  }

  public TraceUpdateOverlay(Context context) {
    super(context);
    mOverlayPaint.setStyle(Paint.Style.STROKE);
    mOverlayPaint.setStrokeWidth(6);
  }

  @UiThread
  public void setOverlays(List<Overlay> overlays) {
    mOverlays = overlays;
    invalidate();
  }

  @Override
  public void onDraw(Canvas canvas) {
    super.onDraw(canvas);

    if (!mOverlays.isEmpty()) {
      // Draw border outside of the given overlays to be aligned with web trace highlights
      for (Overlay overlay : mOverlays) {
        mOverlayPaint.setColor(overlay.getColor());
        canvas.drawRect(overlay.getPixelRect(), mOverlayPaint);
      }
    }
  }
}
