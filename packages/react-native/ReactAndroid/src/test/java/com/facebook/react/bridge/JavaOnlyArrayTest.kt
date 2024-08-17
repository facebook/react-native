/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/** Tests for [JavaOnlyArray] */
class JavaOnlyArrayTest {
  @Test
  fun testGetType() {
    val values =
        JavaOnlyArray.of(1, 2f, 3.0, 4L, "5", false, JavaOnlyArray.of(), JavaOnlyMap.of(), null)

    assertThat(values.getType(0)).isEqualTo(ReadableType.Number)
    assertThat(values.getType(1)).isEqualTo(ReadableType.Number)
    assertThat(values.getType(2)).isEqualTo(ReadableType.Number)
    assertThat(values.getType(3)).isEqualTo(ReadableType.Number)
    assertThat(values.getType(4)).isEqualTo(ReadableType.String)
    assertThat(values.getType(5)).isEqualTo(ReadableType.Boolean)
    assertThat(values.getType(6)).isEqualTo(ReadableType.Array)
    assertThat(values.getType(7)).isEqualTo(ReadableType.Map)
    assertThat(values.getType(8)).isEqualTo(ReadableType.Null)
  }

  @Test
  fun testLongValueNotTruncated() {
    val values = JavaOnlyArray.of(1125899906842623L)

    assertThat(values.getLong(0)).isEqualTo(1125899906842623L)
  }
}
