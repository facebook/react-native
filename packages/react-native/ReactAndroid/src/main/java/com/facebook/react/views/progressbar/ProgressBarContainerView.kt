/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.progressbar

import android.content.Context
import android.graphics.PorterDuff
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ProgressBar
import com.facebook.react.bridge.JSApplicationIllegalArgumentException

/**
 * Controls an enclosing [ProgressBar]. Exists so that the [ProgressBar] can be recreated if the
 * style would change.
 */
public class ProgressBarContainerView(context: Context) : FrameLayout(context) {

  internal var color: Int? = null
  internal var indeterminate = true
  internal var animating = true
  internal var progress = 0.0

  private var progressBar: ProgressBar? = null

  internal fun apply() {
    this.progressBar?.let { progressBar ->
      progressBar.isIndeterminate = indeterminate
      setColor(progressBar)
      progressBar.progress = (progress * MAX_PROGRESS).toInt()
      progressBar.visibility = if (animating) VISIBLE else INVISIBLE
    } ?: throw JSApplicationIllegalArgumentException("setStyle() not called")
  }

  internal fun setStyle(styleName: String?) {
    val style = ReactProgressBarViewManager.getStyleFromString(styleName)
    progressBar =
        ReactProgressBarViewManager.createProgressBar(context, style).apply { max = MAX_PROGRESS }
    removeAllViews()
    addView(
        progressBar,
        ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
  }

  private fun setColor(progressBar: ProgressBar) {
    val drawable =
        if (progressBar.isIndeterminate) {
          progressBar.indeterminateDrawable
        } else {
          progressBar.progressDrawable
        }

    if (drawable == null) {
      return
    }

    @Suppress("DEPRECATION")
    color?.let { drawable.setColorFilter(it, PorterDuff.Mode.SRC_IN) }
        ?: drawable.clearColorFilter()
  }

  private companion object {
    const val MAX_PROGRESS = 1000
  }
}
