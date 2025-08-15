/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.yoga.YogaUnit
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/** Tests for [DimensionPropConverter] */
class DimensionPropConverterTest {

  @Test
  fun doubleReturnsYogaValue() {
    val result = DimensionPropConverter.getDimension(10.5)

    assertThat(result).isNotNull
    assertThat(result?.value).isEqualTo(10.5f)
    assertThat(result?.unit).isEqualTo(YogaUnit.POINT)
  }

  @Test
  fun stringReturnsParsedYogaValue() {
    val result = DimensionPropConverter.getDimension("100%")

    assertThat(result).isNotNull
    assertThat(result?.unit).isEqualTo(YogaUnit.PERCENT)
  }

  @Test
  fun nullReturnsNull() {
    val result = DimensionPropConverter.getDimension(null)

    assertThat(result).isNull()
  }

  @Test(expected = JSApplicationCausedNativeException::class)
  fun invalidTypeThrowsException() {
    DimensionPropConverter.getDimension(listOf(1, 2, 3))
  }
}
