/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

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
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.R
import com.facebook.react.devsupport.interfaces.TracingState
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import java.util.Locale

internal class PerfMonitorOverlayView(
    private val context: Context,
    private val onButtonPress: () -> Unit,
) {
  private var hidden: Boolean = true
  private var hasEventData: Boolean = false
  private val metricsDialog: Dialog
  private val toolbarDialog: Dialog
  private val tooltipDialog: Dialog
  private lateinit var buttonLabel: TextView
  private lateinit var recordingStateLabel: TextView
  private lateinit var durationLabel: TextView
  private lateinit var tooltipLabel: TextView
  private var ttl: Int = 0
  private var hideAfterTimeoutHandler: Handler? = null

  init {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    tooltipDialog = createTooltipDialog()
    metricsDialog = createMetricsDialog()
    toolbarDialog = createToolbarDialog()
  }

  fun show() {
    toolbarDialog.show()
    tooltipDialog.show()
    if (hasEventData) {
      toolbarDialog.window?.decorView?.post { updateMetricsDialogPosition() }
      metricsDialog.show()
    }
    hidden = false
  }

  fun hide() {
    metricsDialog.hide()
    toolbarDialog.hide()
    tooltipDialog.hide()
    hidden = true
  }

  fun resetState() {
    hasEventData = false
    metricsDialog.hide()
  }

  fun updateFocusedEvent(data: PerfMonitorUpdateListener.LongTaskEventData) {
    durationLabel.text = String.format(Locale.US, "%d ms", data.durationMs)
    durationLabel.setTextColor(getDurationHighlightColor(data.responsivenessScore))
    hasEventData = true
    ttl = data.ttl

    hideAfterTimeoutHandler?.removeCallbacksAndMessages(null)

    if (!hidden) {
      metricsDialog.show()

      // Schedule hiding metrics overlay after ttl milliseconds
      if (ttl > 0) {
        if (hideAfterTimeoutHandler == null) {
          hideAfterTimeoutHandler = Handler(Looper.getMainLooper())
        }
        hideAfterTimeoutHandler?.postDelayed({ metricsDialog.hide() }, ttl.toLong())
      }
    }
  }

  fun updateRecordingState(state: TracingState) {
    recordingStateLabel.text =
        when (state) {
          TracingState.ENABLEDINBACKGROUNDMODE -> "Profiling: ON"
          TracingState.DISABLED -> "Profiling: OFF"
          TracingState.ENABLEDINCDPMODE -> "Profiling: DISABLED"
        }
    buttonLabel.text =
        when (state) {
          TracingState.ENABLEDINBACKGROUNDMODE -> "Open ↗️"
          TracingState.DISABLED -> "Start"
          TracingState.ENABLEDINCDPMODE -> ""
        }
    tooltipLabel.text =
        when (state) {
          TracingState.ENABLEDINBACKGROUNDMODE -> "Dev Menu > Finish performance trace"
          TracingState.DISABLED -> "Dev Menu > Start performance trace"
          TracingState.ENABLEDINCDPMODE -> ""
        }
    if (state == TracingState.ENABLEDINCDPMODE) {
      tooltipDialog.hide()
    } else {
      tooltipDialog.show()
    }

    toolbarDialog.window?.decorView?.post { updateMetricsDialogPosition() }
  }

  private fun createMetricsDialog(): Dialog {
    val containerLayout = createInnerLayout()
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
        createAnchoredDialog(getMetricsDialogOffsetX(), dpToPx(16f)).apply {
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

    return dialog
  }

  private fun createToolbarDialog(): Dialog {
    val buttonInner = createInnerLayout()
    recordingStateLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_PRIMARY
          setTextColor(Color.WHITE)
          typeface = TYPEFACE_BOLD
        }
    buttonInner.addView(recordingStateLabel)
    buttonLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_PRIMARY
          setTextColor(COLOR_TEXT_BLUE)
          typeface = TYPEFACE_BOLD
        }
    buttonInner.addView(buttonLabel)
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
          setOnClickListener { onButtonPress() }
        }

    val dialog = createAnchoredDialog(dpToPx(0f), dpToPx(0f)).apply { setContentView(buttonView) }
    dialog.window?.apply {
      attributes =
          attributes?.apply { flags = flags or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE }
    }

    return dialog
  }

  private fun createTooltipDialog(): Dialog {
    val containerLayout = createInnerLayout()
    tooltipLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_ACCESSORY
          setTextColor(Color.WHITE)
        }
    containerLayout.addView(tooltipLabel)

    val dialog =
        createAnchoredDialog(dpToPx(16f), dpToPx(52f)).apply { setContentView(containerLayout) }
    dialog.window?.apply {
      attributes =
          attributes?.apply {
            flags =
                flags or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
          }
    }

    return dialog
  }

  private fun createAnchoredDialog(offsetX: Float, offsetY: Float): Dialog {
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

  private fun createInnerLayout(): LinearLayout {
    return LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      val paddingHorizontal = dpToPx(14f).toInt()
      val paddingVertical = dpToPx(7f).toInt()
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

  private fun getMetricsDialogOffsetX(): Float {
    val toolbarWidth = toolbarDialog?.window?.decorView?.width ?: 0
    return toolbarWidth.toFloat()
  }

  private fun updateMetricsDialogPosition() {
    metricsDialog?.window?.apply {
      attributes = attributes?.apply { x = getMetricsDialogOffsetX().toInt() }
    }
  }

  private fun getDurationHighlightColor(responsivenessScore: Int): Int {
    return when (responsivenessScore) {
      2 -> COLOR_TEXT_RED
      1 -> COLOR_TEXT_YELLOW
      else -> COLOR_TEXT_GREEN
    }
  }

  private fun dpToPx(dp: Float): Float = PixelUtil.toPixelFromDIP(dp)

  companion object {
    private val COLOR_TEXT_GREEN = Color.parseColor("#4AEB2F")
    private val COLOR_TEXT_YELLOW = Color.parseColor("#FFAA00")
    private val COLOR_TEXT_RED = Color.parseColor("#FF0000")
    private val COLOR_TEXT_BLUE = Color.parseColor("#00B0FF")
    private val COLOR_OVERLAY_BORDER = Color.parseColor("#6C6C6C")
    private val TEXT_SIZE_PRIMARY = 13f
    private val TEXT_SIZE_ACCESSORY = 9f
    private val TYPEFACE_BOLD = Typeface.create("sans-serif", Typeface.BOLD)
  }
}
