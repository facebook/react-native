/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.util.Locale

object KotlinStdlibCompatUtils {
  @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN")
  fun String.lowercaseCompat(): String = (this as java.lang.String).toLowerCase(Locale.ROOT)

  fun String.capitalizeCompat(): String =
      if (isNotEmpty()) {
        val firstChar = this[0]
        val uppercaseChar = Character.toUpperCase(firstChar)
        val restString = this@capitalizeCompat.substring(1)
        uppercaseChar + restString
      } else {
        this
      }

  fun String.toBooleanStrictOrNullCompat(): Boolean? =
      when (this) {
        "true" -> true
        "false" -> false
        else -> null
      }
}
