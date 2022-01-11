/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import android.content.Context
import androidx.compose.material.Switch
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.Constraints
import com.facebook.react.kotlin.BackgroundMeasure
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.ReactComposeView
import com.facebook.yoga.YogaMeasureOutput

@Composable
fun ComposeSwitch(
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (isChecked: Boolean) -> Unit
) {
  val checkedState = remember { mutableStateOf(checked) }
  Switch(
      checked = checkedState.value,
      onCheckedChange = {
        checkedState.value = it
        onCheckedChange(it)
      },
      enabled = enabled)
}

fun measureInBackground(
    context: Context,
): Long {
  val backgroundMeasure = BackgroundMeasure(context)
  val size = backgroundMeasure.measureComposable(Constraints()) { ComposeSwitch(false, false, {}) }
  println("Compose switch measured to $size")

  return YogaMeasureOutput.make(
      PixelUtil.toDIPFromPixel(size.width.toFloat()),
      PixelUtil.toDIPFromPixel(size.height.toFloat()))
}

class ReactComposeSwitchView : ReactComposeView {
  constructor(ctx: Context) : super(ctx)

  var switchEnabled: Boolean = true
  var switchChecked: Boolean = true
  var onCheckedChangeListener: (ReactComposeSwitchView, Boolean) -> Unit = { _, _ -> }

  fun updateView(): ReactComposeSwitchView {
    return this.apply {
      setContent {
        ComposeSwitch(switchChecked, switchEnabled) { onCheckedChangeListener(this, it) }
      }
    }
  }
}
