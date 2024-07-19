/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.debuggingoverlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
import androidx.annotation.UiThread
import com.facebook.react.bridge.UiThreadUtil

public class DebuggingOverlay(context: Context) : View(context) {
  private val traceUpdatePaint = Paint()
  private val traceUpdatesToDisplayMap = hashMapOf<Int, TraceUpdate>()
  private val traceUpdateIdToCleanupRunnableMap = hashMapOf<Int, Runnable>()

  private val highlightedElementsPaint = Paint()
  private var highlightedElementsRectangles = mutableListOf<RectF>()

  init {
    traceUpdatePaint.style = Paint.Style.STROKE
    traceUpdatePaint.strokeWidth = 6f
    highlightedElementsPaint.style = Paint.Style.FILL
    highlightedElementsPaint.color = 0xCCC8E6FF.toInt()
  }

  @UiThread
  public fun setTraceUpdates(traceUpdates: List<TraceUpdate>) {
    for (traceUpdate in traceUpdates) {
      val traceUpdateId = traceUpdate.id
      if (traceUpdateIdToCleanupRunnableMap.containsKey(traceUpdateId)) {
        UiThreadUtil.removeOnUiThread(traceUpdateIdToCleanupRunnableMap[traceUpdateId])
        traceUpdateIdToCleanupRunnableMap.remove(traceUpdateId)
      }

      traceUpdatesToDisplayMap[traceUpdateId] = traceUpdate
    }

    invalidate()
  }

  @UiThread
  public fun setHighlightedElementsRectangles(elementsRectangles: MutableList<RectF>) {
    highlightedElementsRectangles = elementsRectangles
    invalidate()
  }

  @UiThread
  public fun clearElementsHighlights() {
    highlightedElementsRectangles.clear()
    invalidate()
  }

  public override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    // Draw border outside of the given overlays to be aligned with web trace highlights
    for (traceUpdate in traceUpdatesToDisplayMap.values) {
      traceUpdatePaint.color = traceUpdate.color
      canvas.drawRect(traceUpdate.rectangle, traceUpdatePaint)

      val traceUpdateId = traceUpdate.id
      val block = Runnable {
        traceUpdatesToDisplayMap.remove(traceUpdateId)
        traceUpdateIdToCleanupRunnableMap.remove(traceUpdateId)

        invalidate()
      }

      if (!traceUpdateIdToCleanupRunnableMap.containsKey(traceUpdateId)) {
        traceUpdateIdToCleanupRunnableMap[traceUpdateId] = block
        UiThreadUtil.runOnUiThread(block, 2000)
      }
    }

    for (elementRectangle in highlightedElementsRectangles) {
      canvas.drawRect(elementRectangle, highlightedElementsPaint)
    }
  }
}
