/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces.exceptionmanager

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import java.util.ArrayList

@DoNotStripAny
@UnstableReactNativeAPI
public fun interface ReactJsExceptionHandler {
  @DoNotStripAny
  public interface ProcessedError {
    @DoNotStripAny
    public interface StackFrame {
      public val file: String?
      public val methodName: String
      public val lineNumber: Int?
      public val column: Int?
    }

    public val message: String
    public val originalMessage: String?
    public val name: String?
    public val componentStack: String?
    public val stack: List<StackFrame>
    public val id: Int
    public val isFatal: Boolean
    public val extraData: ReadableMap
  }

  @DoNotStripAny
  private data class ProcessedErrorStackFrameImpl(
      override val file: String?,
      override val methodName: String,
      override val lineNumber: Int?,
      override val column: Int?,
  ) : ProcessedError.StackFrame

  @DoNotStripAny
  private data class ProcessedErrorImpl(
      override val message: String,
      override val originalMessage: String?,
      override val name: String?,
      override val componentStack: String?,
      override val stack: ArrayList<ProcessedErrorStackFrameImpl>,
      override val id: Int,
      override val isFatal: Boolean,
      override val extraData: ReadableNativeMap,
  ) : ProcessedError

  public fun reportJsException(errorMap: ProcessedError)
}
