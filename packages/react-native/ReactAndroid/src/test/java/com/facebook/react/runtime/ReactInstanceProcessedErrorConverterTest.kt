/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler.ProcessedError
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

@OptIn(UnstableReactNativeAPI::class)
class ReactInstanceProcessedErrorConverterTest {

  @Test
  fun testConvertProcessedError() {
    val error = getProcessedErrorTestData()

    val data = ReactInstanceProcessedErrorConverter.convertProcessedError(error)
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
      map: ReadableMap?,
      filename: String,
      methodName: String,
      lineNumber: Int,
      columnNumber: Int
  ) {
    checkNotNull(map)
    assertThat(map.getString("file")).isEqualTo(filename)
    assertThat(map.getString("methodName")).isEqualTo(methodName)
    assertThat(map.getDouble("lineNumber").toInt()).isEqualTo(lineNumber)
    assertThat(map.getDouble("column").toInt()).isEqualTo(columnNumber)
  }

  private fun getProcessedErrorTestData(): ProcessedError {
    val frame1 =
        object : ProcessedError.StackFrame {
          override val file = "file1"
          override val methodName = "method1"
          override val lineNumber = 1
          override val column = 10
        }

    val frame2 =
        object : ProcessedError.StackFrame {
          override val file = "file2"
          override val methodName = "method2"
          override val lineNumber = 2
          override val column = 20
        }

    val frames = listOf(frame1, frame2)

    return object : ProcessedError {
      override val message = "error message"
      override val originalMessage = null
      override val name = null
      override val componentStack = null
      override val stack = frames
      override val id = 123
      override val isFatal = true
      override val extraData = JavaOnlyMap()
    }
  }
}
