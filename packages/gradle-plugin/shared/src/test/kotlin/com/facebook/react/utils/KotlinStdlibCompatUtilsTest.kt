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
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class KotlinStdlibCompatUtilsTest {

  @Test
  fun lowercaseCompat_withEmptyString() {
    assertThat("".lowercaseCompat()).isEqualTo("")
  }

  @Test
  fun lowercaseCompat_withLowercaseString() {
    assertThat("frodo".lowercaseCompat()).isEqualTo("frodo")
  }

  @Test
  fun lowercaseCompat_withTitlecaseString() {
    assertThat("Frodo".lowercaseCompat()).isEqualTo("frodo")
  }

  @Test
  fun lowercaseCompat_withUppercaseString() {
    assertThat("FRODO".lowercaseCompat()).isEqualTo("frodo")
  }

  @Test
  fun capitalizeCompat_withEmptyString() {
    assertThat("".capitalizeCompat()).isEqualTo("")
  }

  @Test
  fun capitalizeCompat_withLowercaseString() {
    assertThat("bilbo".capitalizeCompat()).isEqualTo("Bilbo")
  }

  @Test
  fun capitalizeCompat_withTitlecaseString() {
    assertThat("Bilbo".capitalizeCompat()).isEqualTo("Bilbo")
  }

  @Test
  fun capitalizeCompat_withUppercaseString() {
    assertThat("BILBO".capitalizeCompat()).isEqualTo("BILBO")
  }

  @Test
  fun toBooleanStrictOrNullCompat_withEmptyString() {
    assertThat("".toBooleanStrictOrNullCompat()).isNull()
  }

  @Test
  fun toBooleanStrictOrNullCompat_withfalse() {
    assertThat("false".toBooleanStrictOrNullCompat()).isFalse()
  }

  @Test
  fun toBooleanStrictOrNullCompat_withCapitalTrue_returnsNull() {
    assertThat("True".toBooleanStrictOrNullCompat()).isNull()
  }

  @Test
  fun toBooleanStrictOrNullCompat_withCapitalFalse_returnsNull() {
    assertThat("False".toBooleanStrictOrNullCompat()).isNull()
  }

  @Test
  fun toBooleanStrictOrNullCompat_withRandomInput_returnsNull() {
    assertThat("maybe".toBooleanStrictOrNullCompat()).isNull()
  }
}
