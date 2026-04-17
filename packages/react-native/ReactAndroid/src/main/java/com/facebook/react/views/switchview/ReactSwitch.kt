/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.RippleDrawable
import android.graphics.drawable.StateListDrawable
import android.view.ContextThemeWrapper
import com.google.android.material.R
import com.google.android.material.color.MaterialColors
import com.google.android.material.materialswitch.MaterialSwitch

/**
 * Switch that has its value controlled by JS. Whenever the value of the switch changes, we do not
 * allow any other changes to that switch until JS sets a value explicitly. This stops the Switch
 * from changing its value multiple times, when those changes have not been processed by JS first.
 */
internal class ReactSwitch(context: Context) : MaterialSwitch(
    ContextThemeWrapper(context, R.style.Theme_Material3_DayNight)
) {

  private var allowChange = true
  private var thumbColorForTrue: Int? = null
  private var thumbColorForFalse: Int? = null
  private var trackColorForTrue: Int? = null
  private var trackColorForFalse: Int? = null
  private var thumbIconDrawableForTrue: Drawable? = null
  private var thumbIconDrawableForFalse: Drawable? = null

  override fun setChecked(checked: Boolean) {
    if (allowChange && isChecked != checked) {
      allowChange = false
      super.setChecked(checked)
    } else {
      // Even if mAllowChange is set to false or the checked value hasn't changed, we still must
      // call the super method, since it will make sure the thumb is moved back to the correct edge.
      // Without calling the super method, the thumb might stuck in the middle of the switch.
      super.setChecked(isChecked)
    }
  }

  override fun setBackgroundColor(color: Int) {
    background =
        RippleDrawable(createRippleDrawableColorStateList(color), ColorDrawable(color), null)
  }

  fun setThumbColor(color: Int?) = setThumbColorForTrue(color)

  fun setThumbColorForTrue(color: Int?) {
    thumbColorForTrue = color
    applyThumbTintList()
  }

  fun setThumbColorForFalse(color: Int?) {
    thumbColorForFalse = color
    applyThumbTintList()
  }

  fun setOn(on: Boolean) {
    // If the switch has a different value than the value sent by JS, we must change it.
    if (isChecked != on) {
      super.setChecked(on)
    }
    allowChange = true
  }

  fun setTrackColorForTrue(color: Int?) {
    trackColorForTrue = color
    applyTrackTintList()
  }

  fun setTrackColorForFalse(color: Int?) {
    trackColorForFalse = color
    applyTrackTintList()
  }

  fun setThumbIconForFalse(drawable: Drawable?) {
    thumbIconDrawableForFalse = drawable
    applyThumbIconDrawable()
  }

  fun setThumbIconForTrue(drawable: Drawable?) {
    thumbIconDrawableForTrue = drawable
    applyThumbIconDrawable()
  }

  private fun applyThumbIconDrawable() {
    if (thumbIconDrawableForTrue == null && thumbIconDrawableForFalse == null) {
      setThumbIconDrawable(null)
      return
    }
    val stateList = StateListDrawable()
    thumbIconDrawableForTrue?.let {
      stateList.addState(intArrayOf(android.R.attr.state_checked), it)
    }
    thumbIconDrawableForFalse?.let {
      stateList.addState(intArrayOf(-android.R.attr.state_checked), it)
    }
    setThumbIconDrawable(stateList)
  }

  private fun applyThumbTintList() {
    if (thumbColorForTrue == null && thumbColorForFalse == null) {
      setThumbTintList(null)
      return
    }
    setThumbTintList(
        ColorStateList(
            arrayOf(
                intArrayOf(android.R.attr.state_checked),
                intArrayOf(-android.R.attr.state_checked)),
            intArrayOf(
                thumbColorForTrue ?: MaterialColors.getColor(this, R.attr.colorOnPrimary),
                thumbColorForFalse ?: MaterialColors.getColor(this, R.attr.colorOutline))))
  }

  private fun applyTrackTintList() {
    if (trackColorForTrue == null && trackColorForFalse == null) {
      setTrackTintList(null)
      return
    }
    setTrackTintList(
        ColorStateList(
            arrayOf(
                intArrayOf(android.R.attr.state_checked),
                intArrayOf(-android.R.attr.state_checked)),
            intArrayOf(
                trackColorForTrue ?: MaterialColors.getColor(this, R.attr.colorPrimary),
                trackColorForFalse ?: MaterialColors.getColor(this, R.attr.colorSurfaceContainerHighest))))
  }

  private fun createRippleDrawableColorStateList(color: Int): ColorStateList =
      ColorStateList(arrayOf(intArrayOf(android.R.attr.state_pressed)), intArrayOf(color))
}
