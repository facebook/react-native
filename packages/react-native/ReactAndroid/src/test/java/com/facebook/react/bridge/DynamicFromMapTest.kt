/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test

/** Tests for [DynamicFromMap] */
class DynamicFromMapTest {
  @Test
  fun testGetDynamic() {
    assertThat(getDynamicFromMap("int").asInt()).isEqualTo(1)
    assertThat(getDynamicFromMap("double").asDouble()).isEqualTo(2.0)
    assertThat(getDynamicFromMap("string").asString()).isEqualTo("str")
    assertThat(getDynamicFromMap("boolean").asBoolean()).isEqualTo(false)
    assertThat(getDynamicFromMap("array").asArray()).isEqualTo(testSource.getArray("array"))
    assertThat(getDynamicFromMap("map").asMap()).isEqualTo(testSource.getMap("map"))
    assertThat(getDynamicFromMap("null").isNull).isEqualTo(true)
    assertThat(getDynamicFromMap("int").type).isEqualTo(ReadableType.Number)
  }

  @Test
  fun testGetFromRecycledDynamic() {
    assertThatThrownBy { getRecycledDynamicFromMap("int").asInt() }
    assertThatThrownBy { getRecycledDynamicFromMap("double").asDouble() }
    assertThatThrownBy { getRecycledDynamicFromMap("string").asString() }
    assertThatThrownBy { getRecycledDynamicFromMap("boolean").asMap() }
    assertThatThrownBy { getRecycledDynamicFromMap("array").asArray() }
    assertThatThrownBy { getRecycledDynamicFromMap("map").asBoolean() }
    assertThatThrownBy { getRecycledDynamicFromMap("null").isNull }
    assertThatThrownBy { getRecycledDynamicFromMap("anything").type }
  }

  private fun getDynamicFromMap(key: String): Dynamic = DynamicFromMap.create(testSource, key)

  private fun getRecycledDynamicFromMap(key: String): Dynamic =
      getDynamicFromMap(key).apply { recycle() }

  companion object {
    private val testSource =
        JavaOnlyMap.of(
            "boolean",
            false,
            "array",
            JavaOnlyArray.of(),
            "map",
            JavaOnlyMap.of(),
            "null",
            null,
            "int",
            1,
            "double",
            2.0,
            "string",
            "str",
        )
  }
}
