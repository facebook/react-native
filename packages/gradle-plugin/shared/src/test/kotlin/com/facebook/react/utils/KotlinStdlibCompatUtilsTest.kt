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
    assertThat("").isEqualTo("".lowercaseCompat())
  }

  @Test
  fun lowercaseCompat_withLowercaseString() {
    assertThat("frodo").isEqualTo("frodo".lowercaseCompat())
  }

  @Test
  fun lowercaseCompat_withTitlecaseString() {
    assertThat("frodo").isEqualTo("Frodo".lowercaseCompat())
  }

  @Test
  fun lowercaseCompat_withUppercaseString() {
    assertThat("frodo").isEqualTo("FRODO".lowercaseCompat())
  }

  @Test
  fun capitalizeCompat_withEmptyString() {
    assertThat("").isEqualTo("".capitalizeCompat())
  }

  @Test
  fun capitalizeCompat_withLowercaseString() {
    assertThat("Bilbo").isEqualTo("bilbo".capitalizeCompat())
  }

  @Test
  fun capitalizeCompat_withTitlecaseString() {
    assertThat("Bilbo").isEqualTo("Bilbo".capitalizeCompat())
  }

  @Test
  fun capitalizeCompat_withUppercaseString() {
    assertThat("BILBO").isEqualTo("BILBO".capitalizeCompat())
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
