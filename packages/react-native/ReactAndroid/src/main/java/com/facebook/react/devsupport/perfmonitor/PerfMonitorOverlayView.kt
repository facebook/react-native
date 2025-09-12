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

internal class PerfMonitorOverlayView(
    private val context: Context,
    private val onButtonPress: () -> Unit,
) {
  private val dialog: Dialog
  private lateinit var statusLabel: TextView
  private lateinit var tooltipLabel: TextView
  private lateinit var statusIndicator: TextView

  init {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    dialog = createToolbarDialog()
  }

  fun show() {
    dialog.show()
  }

  fun hide() {
    dialog.hide()
  }

  fun updateRecordingState(state: TracingState) {
    if (state == TracingState.ENABLEDINCDPMODE) {
      dialog.hide()
      return
    }

    if (state == TracingState.ENABLEDINBACKGROUNDMODE) {
      (statusIndicator.background as GradientDrawable).setColor(Color.RED)
      statusLabel.text = "Background Profiling Active"
      tooltipLabel.text = "Press ☰ to open"
    } else {
      (statusIndicator.background as GradientDrawable).setColor(Color.GRAY)
      statusLabel.text = "Background Profiling Stopped"
      tooltipLabel.text = "Press ☰ to restart"
    }
    dialog.show()
  }

  private fun createToolbarDialog(): Dialog {
    statusIndicator =
        TextView(context).apply {
          width = dpToPx(12f).toInt()
          height = dpToPx(12f).toInt()
          background =
              GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.RED)
              }
        }

    val textContainer =
        LinearLayout(context).apply {
          orientation = LinearLayout.VERTICAL
          layoutParams =
              LinearLayout.LayoutParams(
                  LinearLayout.LayoutParams.WRAP_CONTENT,
                  LinearLayout.LayoutParams.WRAP_CONTENT,
              )
        }
    statusLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_PRIMARY
          setTextColor(Color.WHITE)
          typeface = TYPEFACE_BOLD
        }
    tooltipLabel =
        TextView(context).apply {
          textSize = TEXT_SIZE_ACCESSORY
          setTextColor(Color.WHITE)
          typeface = TYPEFACE_BOLD
        }
    textContainer.addView(statusLabel)
    textContainer.addView(tooltipLabel)

    val containerLayout = createInnerLayout()
    containerLayout.setOnClickListener { onButtonPress() }
    containerLayout.addView(statusIndicator)
    containerLayout.addView(textContainer)

    return createAnchoredDialog(dpToPx(12f), dpToPx(12f)).apply { setContentView(containerLayout) }
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

  private fun dpToPx(dp: Float): Float = PixelUtil.toPixelFromDIP(dp)

  companion object {
    private val COLOR_OVERLAY_BORDER = Color.parseColor("#6C6C6C")
    private val TEXT_SIZE_PRIMARY = 12f
    private val TEXT_SIZE_ACCESSORY = 10f
    private val TYPEFACE_BOLD = Typeface.create("sans-serif", Typeface.BOLD)
  }
}
