/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.unicode

import com.facebook.proguard.annotations.DoNotStrip
import java.text.Collator
import java.text.DateFormat
import java.text.Normalizer
import java.util.Locale

// TODO: use com.facebook.common.locale.Locales.getApplicationLocale() as the current locale,
// rather than the device locale. This is challenging because getApplicationLocale() is only
// available via DI.
@DoNotStrip
public object AndroidUnicodeUtils {

  @DoNotStrip
  @JvmStatic
  public fun localeCompare(left: String?, right: String?): Int {
    val collator = Collator.getInstance()
    return collator.compare(left, right)
  }

  @DoNotStrip
  @JvmStatic
  public fun dateFormat(unixtimeMs: Double, formatDate: Boolean, formatTime: Boolean): String {
    val format =
        when {
          formatDate && formatTime ->
              DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.MEDIUM)
          formatDate -> DateFormat.getDateInstance(DateFormat.MEDIUM)
          formatTime -> DateFormat.getTimeInstance(DateFormat.MEDIUM)
          else -> error("Bad dateFormat configuration")
        }
    return format.format(unixtimeMs.toLong()).toString()
  }

  @DoNotStrip
  @JvmStatic
  public fun convertToCase(input: String, targetCase: Int, useCurrentLocale: Boolean): String {
    // Note Java's case conversions use the user's locale. For example "I".toLowerCase()
    // will produce a dotless i. From Java's docs: "To obtain correct results for locale
    // insensitive strings, use toLowerCase(Locale.ENGLISH)."
    val locale = if (useCurrentLocale) Locale.getDefault() else Locale.ENGLISH
    return when (targetCase) {
      TARGET_LOWERCASE -> input.lowercase(locale)
      TARGET_UPPERCASE -> input.uppercase(locale)
      else -> error("Invalid target case")
    }
  }

  @DoNotStrip
  @JvmStatic
  public fun normalize(input: String?, form: Int): String =
      when (form) {
        FORM_C -> Normalizer.normalize(input, Normalizer.Form.NFC)
        FORM_D -> Normalizer.normalize(input, Normalizer.Form.NFD)
        FORM_KC -> Normalizer.normalize(input, Normalizer.Form.NFKC)
        FORM_KD -> Normalizer.normalize(input, Normalizer.Form.NFKD)
        else -> error("Invalid form")
      }

  // These values must match CaseConversion in PlatformUnicode.h
  private const val TARGET_UPPERCASE = 0
  private const val TARGET_LOWERCASE = 1

  // Values must match NormalizationForm in PlatformUnicode.h.
  private const val FORM_C = 0
  private const val FORM_D = 1
  private const val FORM_KC = 2
  private const val FORM_KD = 3
}
