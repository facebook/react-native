/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class TextTransformTest {
  @Test
  fun textTransformCapitalize() {
    val input = "hello WORLD from ReAcT nAtIvE 2a !b c"
    val output = "Hello WORLD From ReAcT NAtIvE 2a !B C"
    assertThat(TextTransform.apply(input, TextTransform.CAPITALIZE)).isEqualTo(output)
  }

  @Test
  fun textTransformUppercase() {
    val input = "hello WORLD from ReAcT nAtIvE 2a !b c"
    val output = "HELLO WORLD FROM REACT NATIVE 2A !B C"
    assertThat(TextTransform.apply(input, TextTransform.UPPERCASE)).isEqualTo(output)
  }

  @Test
  fun textTransformLowercase() {
    val input = "hello WORLD from ReAcT nAtIvE 2a !b c"
    val output = "hello world from react native 2a !b c"
    assertThat(TextTransform.apply(input, TextTransform.LOWERCASE)).isEqualTo(output)
  }
}
