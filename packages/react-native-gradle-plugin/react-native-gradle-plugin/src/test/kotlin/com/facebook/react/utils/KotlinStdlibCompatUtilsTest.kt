/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.utils.KotlinStdlibCompatUtils.capitalizeCompat
import com.facebook.react.utils.KotlinStdlibCompatUtils.lowercaseCompat
import com.facebook.react.utils.KotlinStdlibCompatUtils.toBooleanStrictOrNullCompat
import org.junit.Assert.assertEquals
import org.junit.Test

class KotlinStdlibCompatUtilsTest {

  @Test
  fun lowercaseCompat_withEmptyString() {
    assertEquals("", "".lowercaseCompat())
  }

  @Test
  fun lowercaseCompat_withLowercaseString() {
    assertEquals("frodo", "frodo".lowercaseCompat())
  }

  @Test
  fun lowercaseCompat_withTitlecaseString() {
    assertEquals("frodo", "Frodo".lowercaseCompat())
  }

  @Test
  fun lowercaseCompat_withUppercaseString() {
    assertEquals("frodo", "FRODO".lowercaseCompat())
  }

  @Test
  fun capitalizeCompat_withEmptyString() {
    assertEquals("", "".capitalizeCompat())
  }

  @Test
  fun capitalizeCompat_withLowercaseString() {
    assertEquals("Bilbo", "bilbo".capitalizeCompat())
  }

  @Test
  fun capitalizeCompat_withTitlecaseString() {
    assertEquals("Bilbo", "Bilbo".capitalizeCompat())
  }

  @Test
  fun capitalizeCompat_withUppercaseString() {
    assertEquals("BILBO", "BILBO".capitalizeCompat())
  }

  @Test
  fun toBooleanStrictOrNullCompat_withEmptyString() {
    assertEquals(null, "".toBooleanStrictOrNullCompat())
  }

  @Test
  fun toBooleanStrictOrNullCompat_withfalse() {
    assertEquals(false, "false".toBooleanStrictOrNullCompat())
  }

  @Test
  fun toBooleanStrictOrNullCompat_withCapitalTrue_returnsNull() {
    assertEquals(null, "True".toBooleanStrictOrNullCompat())
  }

  @Test
  fun toBooleanStrictOrNullCompat_withCapitalFalse_returnsNull() {
    assertEquals(null, "False".toBooleanStrictOrNullCompat())
  }

  @Test
  fun toBooleanStrictOrNullCompat_withRandomInput_returnsNull() {
    assertEquals(null, "maybe".toBooleanStrictOrNullCompat())
  }
}
