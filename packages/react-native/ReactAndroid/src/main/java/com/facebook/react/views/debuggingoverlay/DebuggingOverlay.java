/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.debuggingoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;
import androidx.annotation.UiThread;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.UiThreadUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class DebuggingOverlay extends View {

  private final Paint mTraceUpdatePaint = new Paint();
  private HashMap<Integer, TraceUpdate> mTraceUpdatesToDisplayMap = new HashMap();
  private HashMap<Integer, Runnable> mTraceUpdateIdToCleanupRunnableMap = new HashMap();

  private final Paint mHighlightedElementsPaint = new Paint();
  private List<RectF> mHighlightedElementsRectangles = new ArrayList<>();

  public DebuggingOverlay(Context context) {
    super(context);

    mTraceUpdatePaint.setStyle(Paint.Style.STROKE);
    mTraceUpdatePaint.setStrokeWidth(6);

    mHighlightedElementsPaint.setStyle(Paint.Style.FILL);
    mHighlightedElementsPaint.setColor(0xCCC8E6FF);
  }

  @UiThread
  public void setTraceUpdates(List<TraceUpdate> traceUpdates) {
    for (TraceUpdate traceUpdate : traceUpdates) {
      int traceUpdateId = traceUpdate.getId();
      if (mTraceUpdateIdToCleanupRunnableMap.containsKey(traceUpdateId)) {
        UiThreadUtil.removeOnUiThread(mTraceUpdateIdToCleanupRunnableMap.get(traceUpdateId));
        mTraceUpdateIdToCleanupRunnableMap.remove(traceUpdateId);
      }

      mTraceUpdatesToDisplayMap.put(traceUpdateId, traceUpdate);
    }

    invalidate();
  }

  @UiThread
  public void setHighlightedElementsRectangles(List<RectF> elementsRectangles) {
    mHighlightedElementsRectangles = elementsRectangles;
    invalidate();
  }

  @UiThread
  public void clearElementsHighlights() {
    mHighlightedElementsRectangles.clear();
    invalidate();
  }

  @Override
  public void onDraw(Canvas canvas) {
    super.onDraw(canvas);

    // Draw border outside of the given overlays to be aligned with web trace highlights
    for (TraceUpdate traceUpdate : mTraceUpdatesToDisplayMap.values()) {
      mTraceUpdatePaint.setColor(traceUpdate.getColor());
      canvas.drawRect(traceUpdate.getRectangle(), mTraceUpdatePaint);

      int traceUpdateId = traceUpdate.getId();
      Runnable block =
          () -> {
            mTraceUpdatesToDisplayMap.remove(traceUpdateId);
            mTraceUpdateIdToCleanupRunnableMap.remove(traceUpdateId);

            invalidate();
          };

      if (!mTraceUpdateIdToCleanupRunnableMap.containsKey(traceUpdateId)) {
        mTraceUpdateIdToCleanupRunnableMap.put(traceUpdateId, block);
        UiThreadUtil.runOnUiThread(block, 2000);
      }
    }

    for (RectF elementRectangle : mHighlightedElementsRectangles) {
      canvas.drawRect(elementRectangle, mHighlightedElementsPaint);
    }
  }
}
