/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import java.util.Locale
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class InterpolatorTypeTest {
  @Test
  fun testCamelCase() {
    assertThat(InterpolatorType.fromString("linear")).isEqualTo(InterpolatorType.LINEAR)
    assertThat(InterpolatorType.fromString("easeIn")).isEqualTo(InterpolatorType.EASE_IN)
    assertThat(InterpolatorType.fromString("easeOut")).isEqualTo(InterpolatorType.EASE_OUT)
    assertThat(InterpolatorType.fromString("easeInEaseOut"))
        .isEqualTo(InterpolatorType.EASE_IN_EASE_OUT)
    assertThat(InterpolatorType.fromString("spring")).isEqualTo(InterpolatorType.SPRING)
  }

  @Test
  fun testOtherCases() {
    assertThat(InterpolatorType.fromString("EASEIN")).isEqualTo(InterpolatorType.EASE_IN)
    assertThat(InterpolatorType.fromString("easeout")).isEqualTo(InterpolatorType.EASE_OUT)
    assertThat(InterpolatorType.fromString("easeineaseout"))
        .isEqualTo(InterpolatorType.EASE_IN_EASE_OUT)
  }

  @Test
  fun testLocales() {
    Locale.setDefault(Locale.forLanguageTag("tr-TR"))
    assertThat(InterpolatorType.fromString("easeInEaseOut"))
        .isEqualTo(InterpolatorType.EASE_IN_EASE_OUT)
  }

  @Test(expected = IllegalArgumentException::class)
  @Throws(IllegalArgumentException::class)
  fun testInvalidInterpolatorTypes() {
    InterpolatorType.fromString("ease_in_ease_out")
  }
}
