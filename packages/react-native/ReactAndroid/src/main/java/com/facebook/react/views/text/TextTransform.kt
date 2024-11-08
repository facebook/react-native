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
public enum class TextTransform {

  NONE,
  UPPERCASE,
  LOWERCASE,
  CAPITALIZE,
  UNSET;

  public companion object {
    @JvmStatic
    public fun apply(text: String?, textTransform: TextTransform?): String? {
      if (text == null) {
        return null
      }
      val transformed: String =
          when (textTransform) {
            UPPERCASE -> text.uppercase(Locale.getDefault())
            LOWERCASE -> text.lowercase(Locale.getDefault())
            CAPITALIZE -> capitalize(text)
            else -> text
          }
      return transformed
    }

    private fun capitalize(text: String): String {
      val wordIterator = BreakIterator.getWordInstance()
      wordIterator.setText(text)

      val res = StringBuilder(text.length)
      var start = wordIterator.first()
      var end = wordIterator.next()
      while (end != BreakIterator.DONE) {
        res.append(text[start].uppercaseChar())
        res.append(text.substring(start + 1, end))
        start = end
        end = wordIterator.next()
      }

      return res.toString()
    }
  }
}
