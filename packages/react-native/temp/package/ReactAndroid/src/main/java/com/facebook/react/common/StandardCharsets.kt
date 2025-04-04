/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import java.nio.charset.Charset
import kotlin.jvm.JvmField

/**
 * Not all versions of Android SDK have this class in nio package. This is the reason to have it
 * around.
 */
@Deprecated(
    message =
        "Deprecated class since v0.73.0, please use java.nio.charset.StandardCharsets instead.",
    replaceWith = ReplaceWith("java.nio.charset.StandardCharsets"),
    level = DeprecationLevel.ERROR)
public object StandardCharsets {
  /** Eight-bit UCS Transformation Format */
  @JvmField public val UTF_8: Charset = Charset.forName("UTF-8")
  /** Sixteen-bit UCS Transformation Format, byte order identified by an optional byte-order mark */
  @JvmField public val UTF_16: Charset = Charset.forName("UTF-16")
  /** Sixteen-bit UCS Transformation Format, big-endian byte order */
  @JvmField public val UTF_16BE: Charset = Charset.forName("UTF-16BE")
  /** Sixteen-bit UCS Transformation Format, little-endian byte order */
  @JvmField public val UTF_16LE: Charset = Charset.forName("UTF-16LE")
}
