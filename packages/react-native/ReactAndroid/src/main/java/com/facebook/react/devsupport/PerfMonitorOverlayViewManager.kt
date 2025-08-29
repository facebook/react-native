/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.Window
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.util.Supplier
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.PerfMonitorOverlayManager
import com.facebook.react.devsupport.interfaces.TracingState
import com.facebook.react.devsupport.perfmonitor.PerfMonitorInspectorTargetBinding
import com.facebook.react.devsupport.perfmonitor.PerfMonitorUpdateListener
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import java.util.Locale

internal class PerfMonitorOverlayViewManager(
    private val contextSupplier: Supplier<Context?>,
    private val inspectorTarget: PerfMonitorInspectorTargetBinding?,
) : PerfMonitorOverlayManager, PerfMonitorUpdateListener {
  private var initialized: Boolean = false
  private var enabled: Boolean = false
  private var hasInteractionData: Boolean = false
  private var interactionDialog: Dialog? = null
  private var buttonDialog: Dialog? = null
  private var durationLabel: TextView? = null
  private var ttl: Int = 0
  private var hideAfterTimeoutHandler: Handler? = null

  override fun enable() {
    UiThreadUtil.runOnUiThread {
      enabled = true
      if (hasInteractionData) {
        showOverlay()
      }
    }
  }

  override fun disable() {
    UiThreadUtil.runOnUiThread {
      enabled = false
      hideOverlay()
    }
  }

  override fun reset() {
    UiThreadUtil.runOnUiThread {
      hasInteractionData = false
      hideOverlay()
    }
  }

  override fun onRecordingStateChanged(state: TracingState) {
    // recordingState = state
    // view?.updateRecordingState(state)
  }

  override fun onNewFocusedEvent(data: PerfMonitorUpdateListener.LongTaskEventData) {
    UiThreadUtil.runOnUiThread {
      ensureInitialized()
      durationLabel?.text = String.format(Locale.US, "%d ms", data.durationMs)
      durationLabel?.setTextColor(getDurationHighlightColor(data.responsivenessScore))
      hasInteractionData = true
      ttl = data.ttl

      hideAfterTimeoutHandler?.removeCallbacksAndMessages(null)

      if (enabled) {
        showOverlay()

        // Schedule hiding overlay after ttl milliseconds
        if (ttl > 0) {
          if (hideAfterTimeoutHandler == null) {
            hideAfterTimeoutHandler = Handler(Looper.getMainLooper())
          }
          hideAfterTimeoutHandler?.postDelayed({ hideOverlay() }, ttl.toLong())
        }
      }
    }
  }

  private fun ensureInitialized() {
    if (initialized) {
      return
    }
    val context = contextSupplier.get() ?: return
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    createDialog(context)
    createButton(context)
    initialized = true
  }

  private fun showOverlay() {
    interactionDialog?.show()
    buttonDialog?.show()
  }

  private fun hideOverlay() {
    interactionDialog?.hide()
    buttonDialog?.hide()
  }

  private fun createDialog(context: Context) {
    val containerLayout = createInnerLayout(context)
    val longTaskLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_PRIMARY
          text = "Long Task"
          setTextColor(Color.WHITE)
          typeface = TYPEFACE_BOLD
        }
    durationLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_PRIMARY
          setTextColor(COLOR_TEXT_GREEN)
          typeface = TYPEFACE_BOLD
        }
    containerLayout.addView(longTaskLabel)
    containerLayout.addView(durationLabel)

    val dialog =
        createAnchoredDialog(context, dpToPx(140f), dpToPx(16f)).apply {
          setContentView(containerLayout)
        }
    dialog.window?.apply {
      attributes =
          attributes?.apply {
            flags =
                flags or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
          }
    }

    this.interactionDialog = dialog
  }

  fun updateRecordingState(state: TracingState) {}

  private fun createButton(context: Context) {
    val buttonInner = createInnerLayout(context)
    buttonInner.addView(
        TextView(context).apply {
          text = "Analyze"
          textSize = TEXT_SIZE_PRIMARY
          setTextColor(Color.WHITE)
          typeface = TYPEFACE_BOLD
        }
    )
    buttonInner.addView(
        TextView(context).apply {
          text = "cmd + A"
          textSize = TEXT_SIZE_ACCESSORY
          setTextColor(Color.WHITE)
          alpha = 0.7f
          typeface = TYPEFACE_BOLD
        }
    )
    val buttonView =
        LinearLayout(context).apply {
          orientation = LinearLayout.VERTICAL
          setPadding(
              dpToPx(8f).toInt(),
              dpToPx(16f).toInt(),
              dpToPx(16f).toInt(),
              dpToPx(8f).toInt(),
          )
          addView(buttonInner)
          setOnClickListener { inspectorTarget?.pauseAndAnalyzeBackgroundTrace() }
        }
    val dialog =
        createAnchoredDialog(context, dpToPx(0f), dpToPx(0f)).apply { setContentView(buttonView) }
    dialog.window?.apply {
      attributes =
          attributes?.apply { flags = flags or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE }
    }

    this.buttonDialog = dialog
  }

  private fun createAnchoredDialog(context: Context, offsetX: Float, offsetY: Float): Dialog {
    val dialog =
        Dialog(context, R.style.NoAnimationDialog).apply {
          requestWindowFeature(Window.FEATURE_NO_TITLE)
          window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
          window?.setDimAmount(0f)
          setCancelable(false)
        }
    dialog.window?.apply {
      attributes =
          attributes?.apply {
            width = WindowManager.LayoutParams.WRAP_CONTENT
            height = WindowManager.LayoutParams.WRAP_CONTENT
            gravity = Gravity.TOP or Gravity.END
            x = offsetX.toInt()
            y = offsetY.toInt()
          }
    }
    dialog.window?.decorView?.let { decorView ->
      ViewCompat.setOnApplyWindowInsetsListener(decorView) { view, windowInsets ->
        val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
        val layoutParams = (view.layoutParams as WindowManager.LayoutParams)
        layoutParams.y = insets.top + offsetY.toInt()
        dialog.window?.attributes = layoutParams
        WindowInsetsCompat.CONSUMED
      }
    }

    return dialog
  }

  private fun createInnerLayout(context: Context): LinearLayout {
    return LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      val paddingHorizontal = dpToPx(14f).toInt()
      val paddingVertical = dpToPx(8f).toInt()
      setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, paddingVertical)
      layoutParams =
          LinearLayout.LayoutParams(
              LinearLayout.LayoutParams.WRAP_CONTENT,
              LinearLayout.LayoutParams.WRAP_CONTENT,
          )
      background =
          GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(Color.BLACK)
            cornerRadius = dpToPx(14.5f)
            alpha = (0.8 * 255).toInt()
            setStroke(dpToPx(1f).toInt(), COLOR_OVERLAY_BORDER)
          }
      showDividers = LinearLayout.SHOW_DIVIDER_MIDDLE
      dividerDrawable =
          object : ColorDrawable(Color.TRANSPARENT) {
            override fun getIntrinsicWidth(): Int = dpToPx(8f).toInt()
          }
    }
  }

  private fun getDurationHighlightColor(responsivenessScore: Int): Int {
    return when (responsivenessScore) {
      3 -> COLOR_TEXT_RED
      2 -> COLOR_TEXT_YELLOW
      else -> COLOR_TEXT_GREEN
    }
  }

  private fun dpToPx(dp: Float): Float = PixelUtil.toPixelFromDIP(dp)

  companion object {
    private val COLOR_TEXT_GREEN = Color.parseColor("#4AEB2F")
    private val COLOR_TEXT_YELLOW = Color.parseColor("#FFAA00")
    private val COLOR_TEXT_RED = Color.parseColor("#FF0000")
    private val COLOR_OVERLAY_BORDER = Color.parseColor("#6C6C6C")
    private val TEXT_SIZE_PRIMARY = 13f
    private val TEXT_SIZE_ACCESSORY = 9f
    private val TYPEFACE_BOLD = Typeface.create("sans-serif", Typeface.BOLD)
  }
}
