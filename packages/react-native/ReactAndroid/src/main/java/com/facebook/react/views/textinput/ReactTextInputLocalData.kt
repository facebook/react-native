/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.text.SpannableStringBuilder
import android.util.TypedValue
import android.widget.EditText

/** Local state bearer for EditText instance. */
public class ReactTextInputLocalData(editText: EditText) {
  private val text = SpannableStringBuilder(editText.text)
  private val textSize = editText.textSize
  private val minLines = editText.minLines
  private val maxLines = editText.maxLines
  private val inputType = editText.inputType
  private val breakStrategy = editText.breakStrategy
  private val placeholder: CharSequence? = editText.hint

  public fun apply(editText: EditText) {
    editText.text = text
    editText.setTextSize(TypedValue.COMPLEX_UNIT_PX, textSize)
    editText.minLines = minLines
    editText.maxLines = maxLines
    editText.inputType = inputType
    editText.hint = placeholder
    editText.breakStrategy = breakStrategy
  }
}
