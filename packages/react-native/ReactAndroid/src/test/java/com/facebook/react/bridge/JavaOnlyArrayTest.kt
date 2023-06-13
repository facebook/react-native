/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.bridge

import org.assertj.core.api.Assertions
import org.junit.Test

/** Tests for [JavaOnlyArray]  */
class JavaOnlyArrayTest {
    @Test
    @Throws(Exception::class)
    fun testGetType() {
        val values = JavaOnlyArray.of(1, 2f, 3.0, "4", false, JavaOnlyArray.of(), JavaOnlyMap.of(), null)
        val expectedTypes = arrayOf(
                ReadableType.Number,
                ReadableType.Number,
                ReadableType.Number,
                ReadableType.String,
                ReadableType.Boolean,
                ReadableType.Array,
                ReadableType.Map,
                ReadableType.Null
        )
        for (i in 0 until values.size()) {
            Assertions.assertThat(values.getType(i)).isEqualTo(expectedTypes[i])
        }
    }
}
