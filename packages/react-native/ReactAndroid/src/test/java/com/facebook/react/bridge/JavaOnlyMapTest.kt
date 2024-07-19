/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/** Tests for [JavaOnlyMap] */
class JavaOnlyMapTest {
  @Test
  fun testGetType() {
    val values =
        JavaOnlyMap.of(
            "int",
            1,
            "float",
            2f,
            "double",
            3.0,
            "long",
            4L,
            "string",
            "5",
            "boolean",
            false,
            "array",
            JavaOnlyArray.of(),
            "map",
            JavaOnlyMap.of(),
            "null",
            null)

    assertThat(values.getType("int")).isEqualTo(ReadableType.Number)
    assertThat(values.getType("float")).isEqualTo(ReadableType.Number)
    assertThat(values.getType("double")).isEqualTo(ReadableType.Number)
    assertThat(values.getType("long")).isEqualTo(ReadableType.Number)
    assertThat(values.getType("string")).isEqualTo(ReadableType.String)
    assertThat(values.getType("boolean")).isEqualTo(ReadableType.Boolean)
    assertThat(values.getType("array")).isEqualTo(ReadableType.Array)
    assertThat(values.getType("map")).isEqualTo(ReadableType.Map)
    assertThat(values.getType("null")).isEqualTo(ReadableType.Null)
  }

  @Test
  fun testLongValueNotTruncated() {
    val values = JavaOnlyMap.of("long", 1125899906842623L)

    assertThat(values.getLong("long")).isEqualTo(1125899906842623L)
  }
}
