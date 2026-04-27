/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.View
import android.view.Window
import androidx.annotation.RequiresApi
import androidx.annotation.UiThread
import androidx.core.graphics.createBitmap
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.mounting.MountingManager

/**
 * Manages bitmap snapshots of views during view transitions. Captures bitmaps from old views and
 * applies them to pseudo-element shadow nodes, re-applying after each mount cycle since views may
 * be recreated. Cleans up entries whose views have been deleted.
 */
@OptIn(UnstableReactNativeAPI::class)
internal class ViewTransitionSnapshotManager(
    private val uiManager: FabricUIManager,
    private val mountingManager: MountingManager,
) : UIManagerListener {

  companion object {
    private fun captureSoftwareBitmap(view: View): Bitmap {
      val bitmap = createBitmap(view.width, view.height)
      view.draw(Canvas(bitmap))
      return bitmap
    }
  }

  // Captured bitmaps keyed by source tag. Populated by onBitmapCaptured.
  @ThreadConfined(ThreadConfined.UI) private val viewSnapshots = LinkedHashMap<Int, Bitmap>()

  // Source→target tag mapping. Populated by setViewSnapshot.
  // A snapshot is resolved when both maps contain an entry for the same source tag.
  @ThreadConfined(ThreadConfined.UI) private val pendingTargets = LinkedHashMap<Int, Int>()

  @ThreadConfined(ThreadConfined.UI) private var listenerRegistered = false

  private val mainHandler = Handler(Looper.getMainLooper())

  @UiThread
  private fun onBitmapCaptured(reactTag: Int, bitmap: Bitmap) {
    viewSnapshots[reactTag] = bitmap
    if (reactTag in pendingTargets) {
      ensureListenerRegistered()
    }
  }

  @UiThread
  private fun ensureListenerRegistered() {
    if (!listenerRegistered) {
      listenerRegistered = true
      uiManager.addUIManagerEventListener(this)
    }
  }

  /**
   * Captures a bitmap snapshot of the view identified by the given tag. On API 26+, uses PixelCopy
   * to capture directly from the GPU-composited surface (faster for complex views, captures
   * hardware-accelerated content). Falls back to View.draw() on older APIs.
   */
  fun captureViewSnapshot(reactTag: Int, surfaceId: Int) {
    UiThreadUtil.runOnUiThread {
      val smm = mountingManager.getSurfaceManager(surfaceId) ?: return@runOnUiThread
      if (!smm.getViewExists(reactTag)) return@runOnUiThread
      val view = smm.getView(reactTag)
      if (view.width <= 0 || view.height <= 0) return@runOnUiThread

      val window =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            (view.context as? com.facebook.react.bridge.ReactContext)?.getCurrentActivity()?.window
          } else {
            null
          }

      if (window != null) {
        captureHardwareBitmap(view, reactTag, window)
      } else {
        // Software fallback runs synchronously, so onBitmapCaptured always
        // completes before setViewSnapshot is called.
        onBitmapCaptured(reactTag, captureSoftwareBitmap(view))
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun captureHardwareBitmap(view: View, reactTag: Int, window: Window) {
    val location = IntArray(2)
    view.getLocationInWindow(location)

    // The view's rect in window coordinates.
    val viewRect =
        Rect(location[0], location[1], location[0] + view.width, location[1] + view.height)

    // Clamp to window bounds — PixelCopy only captures what's visible on the
    // window surface. Without clamping, off-screen portions are black/empty
    // and the partial result gets stretched to fill the pseudo-element.
    val windowWidth = window.decorView.width
    val windowHeight = window.decorView.height
    val clampedRect =
        Rect(
            viewRect.left.coerceAtLeast(0),
            viewRect.top.coerceAtLeast(0),
            viewRect.right.coerceAtMost(windowWidth),
            viewRect.bottom.coerceAtMost(windowHeight),
        )

    if (clampedRect.isEmpty) {
      // Entirely off-screen — nothing to capture.
      return
    }

    val clampedBitmap = createBitmap(clampedRect.width(), clampedRect.height())
    // Offset of the clamped region within the full view.
    val offsetX = clampedRect.left - viewRect.left
    val offsetY = clampedRect.top - viewRect.top

    // PixelCopy callback is posted to mainHandler, so onBitmapCaptured may run after
    // setViewSnapshot has already recorded the target tag for this source tag.
    try {
      PixelCopy.request(
          window,
          clampedRect,
          clampedBitmap,
          { copyResult ->
            if (copyResult == PixelCopy.SUCCESS) {
              // Compose the clamped capture into a full-size bitmap at the
              // correct offset so it aligns with the pseudo-element's bounds.
              val fullBitmap = createBitmap(view.width, view.height)
              Canvas(fullBitmap)
                  .drawBitmap(clampedBitmap, offsetX.toFloat(), offsetY.toFloat(), null)
              clampedBitmap.recycle()
              onBitmapCaptured(reactTag, fullBitmap)
            } else {
              clampedBitmap.recycle()
              onBitmapCaptured(reactTag, captureSoftwareBitmap(view))
            }
          },
          mainHandler,
      )
    } catch (e: IllegalArgumentException) {
      // Window surface may have been destroyed (e.g., device idle/sleep).
      // Fall back to software rendering.
      clampedBitmap.recycle()
      onBitmapCaptured(reactTag, captureSoftwareBitmap(view))
    }
  }

  /**
   * Maps a previously captured bitmap from a source view to a target pseudo-element view. If the
   * bitmap is already available, the snapshot becomes resolved and will be re-applied after mount
   * cycles.
   */
  fun setViewSnapshot(sourceTag: Int, targetTag: Int) {
    UiThreadUtil.runOnUiThread {
      pendingTargets[sourceTag] = targetTag
      if (sourceTag in viewSnapshots) {
        ensureListenerRegistered()
      }
    }
  }

  /**
   * Clears all snapshots. Called when a view transition ends to release bitmaps and unregister the
   * mount listener.
   */
  fun clearPendingSnapshots() {
    UiThreadUtil.runOnUiThread {
      viewSnapshots.clear()
      pendingTargets.clear()
      if (listenerRegistered) {
        listenerRegistered = false
        uiManager.removeUIManagerEventListener(this)
      }
    }
  }

  override fun willDispatchViewUpdates(uiManager: UIManager) {}

  override fun willMountItems(uiManager: UIManager) {}

  @UiThread
  override fun didMountItems(uiManager: UIManager) {
    for ((sourceTag, targetTag) in pendingTargets) {
      val smm = mountingManager.getSurfaceManagerForView(targetTag) ?: continue
      val bitmap = viewSnapshots[sourceTag] ?: continue
      smm.applyViewSnapshot(targetTag, bitmap)
    }
  }

  override fun didDispatchMountItems(uiManager: UIManager) {}

  override fun didScheduleMountItems(uiManager: UIManager) {}
}
