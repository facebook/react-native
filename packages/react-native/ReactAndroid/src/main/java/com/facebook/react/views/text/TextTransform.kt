/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import java.text.BreakIterator
import java.util.Locale

/** Types of text transforms for CustomTextTransformSpan */
internal enum class TextTransform {

  NONE,
  UPPERCASE,
  LOWERCASE,
  CAPITALIZE,
  UNSET;

  internal companion object {
    @JvmStatic
    fun apply(text: String, textTransform: TextTransform?): String =
        text.applyTextTransform(textTransform)
  }
}

internal fun String.applyTextTransform(textTransform: TextTransform?): String {
  return when (textTransform) {
    TextTransform.UPPERCASE -> uppercase(Locale.getDefault())
    TextTransform.LOWERCASE -> lowercase(Locale.getDefault())
    TextTransform.CAPITALIZE -> {
      val wordIterator = BreakIterator.getWordInstance()
      wordIterator.setText(this)
      val res = StringBuilder(length)
      var start = wordIterator.first()
      var end = wordIterator.next()
      while (end != BreakIterator.DONE) {
        res.append(substring(start, end).replaceFirstChar { it.uppercaseChar() })
        start = end
        end = wordIterator.next()
      }
      res.toString()
    }
    else -> this
  }
}
