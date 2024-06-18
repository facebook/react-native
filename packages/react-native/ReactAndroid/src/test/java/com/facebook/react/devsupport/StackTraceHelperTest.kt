/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@OptIn(UnstableReactNativeAPI::class)
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

  @Test
  fun testConvertParsedError() {
    val error = getParsedErrorTestData()

    val data = StackTraceHelper.convertParsedError(error)
    assertThat(data.getString("message")).isEqualTo("error message")
    assertThat(data.getInt("id")).isEqualTo(123)
    assertThat(data.getBoolean("isFatal")).isEqualTo(true)

    val stack = data.getArray("stack")
    assertThat(stack).isNotNull()
    stack?.let {
      assertThat(stack.size()).isEqualTo(2)
      assertStackFrameMap(stack.getMap(0), "file1", "method1", 1, 10)
      assertStackFrameMap(stack.getMap(1), "file2", "method2", 2, 20)
    }
  }

  private fun assertStackFrameMap(
      map: ReadableMap,
      filename: String,
      methodName: String,
      lineNumber: Int,
      columnNumber: Int
  ) {

    assertThat(map.getString("file")).isEqualTo(filename)
    assertThat(map.getString("methodName")).isEqualTo(methodName)
    assertThat(map.getDouble("lineNumber").toInt()).isEqualTo(lineNumber)
    assertThat(map.getDouble("column").toInt()).isEqualTo(columnNumber)
  }

  private fun getParsedErrorTestData(): ParsedError {
    val frame1 =
        object : ParsedError.StackFrame {
          override val fileName = "file1"
          override val methodName = "method1"
          override val lineNumber = 1
          override val columnNumber = 10
        }

    val frame2 =
        object : ParsedError.StackFrame {
          override val fileName = "file2"
          override val methodName = "method2"
          override val lineNumber = 2
          override val columnNumber = 20
        }

    val frames = listOf(frame1, frame2)

    return object : ParsedError {
      override val frames = frames
      override val message = "error message"
      override val exceptionId = 123
      override val isFatal = true
    }
  }
}
