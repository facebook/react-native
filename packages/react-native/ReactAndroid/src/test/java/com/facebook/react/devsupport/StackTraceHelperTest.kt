/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class StackTraceHelperTest {
  @Test
  fun testParseAlternateFormatStackFrameWithMethod() {
    val frame = StackTraceHelper.convertJsStackTrace("at func1 (/path/to/file.js:2:18)").get(0)
    assertThat(frame.method).isEqualTo("func1")
    assertThat(frame.fileName).isEqualTo("file.js")
    assertThat(frame.line).isEqualTo(2)
    assertThat(frame.column).isEqualTo(18)
  }

  @Test
  fun testParseStackFrameWithMethod() {
    val frame = StackTraceHelper.convertJsStackTrace("render@Test.bundle:1:2000").get(0)
    assertThat(frame.method).isEqualTo("render")
    assertThat(frame.fileName).isEqualTo("Test.bundle")
    assertThat(frame.line).isEqualTo(1)
    assertThat(frame.column).isEqualTo(2000)
  }

  @Test
  fun testParseStackFrameWithoutMethod() {
    val frame = StackTraceHelper.convertJsStackTrace("Test.bundle:1:2000").get(0)
    assertThat(frame.method).isEqualTo("(unknown)")
    assertThat(frame.fileName).isEqualTo("Test.bundle")
    assertThat(frame.line).isEqualTo(1)
    assertThat(frame.column).isEqualTo(2000)
  }

  @Test
  fun testParseStackFrameWithInvalidFrame() {
    val frame = StackTraceHelper.convertJsStackTrace("Test.bundle:ten:twenty").get(0)
    assertThat(frame.method).isEqualTo("Test.bundle:ten:twenty")
    assertThat(frame.fileName).isEqualTo("")
    assertThat(frame.line).isEqualTo(-1)
    assertThat(frame.column).isEqualTo(-1)
  }

  @Test
  fun testParseStackFrameWithNativeCodeFrame() {
    val frame = StackTraceHelper.convertJsStackTrace("forEach@[native code]").get(0)
    assertThat(frame.method).isEqualTo("forEach@[native code]")
    assertThat(frame.fileName).isEqualTo("")
    assertThat(frame.line).isEqualTo(-1)
    assertThat(frame.column).isEqualTo(-1)
  }
}
