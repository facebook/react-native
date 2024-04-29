/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces.exceptionmanager

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import java.util.ArrayList

@DoNotStripAny
@UnstableReactNativeAPI
public fun interface ReactJsExceptionHandler {
  @DoNotStripAny
  public interface ParsedError {
    @DoNotStripAny
    public interface StackFrame {
      public val fileName: String
      public val methodName: String
      public val lineNumber: Int
      public val columnNumber: Int
    }

    public val frames: List<StackFrame>
    public val message: String
    public val exceptionId: Int
    public val isFatal: Boolean
  }

  @DoNotStripAny
  private data class ParsedStackFrameImpl(
      override val fileName: String,
      override val methodName: String,
      override val lineNumber: Int,
      override val columnNumber: Int,
  ) : ParsedError.StackFrame

  @DoNotStripAny
  private data class ParsedErrorImpl(
      override val frames: ArrayList<ParsedStackFrameImpl>,
      override val message: String,
      override val exceptionId: Int,
      override val isFatal: Boolean,
  ) : ParsedError

  public fun reportJsException(errorMap: ParsedError)
}
