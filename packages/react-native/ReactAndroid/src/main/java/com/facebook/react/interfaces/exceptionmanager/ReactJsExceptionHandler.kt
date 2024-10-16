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
  public interface ParsedError {
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
  private data class ParsedStackFrameImpl(
      override val file: String?,
      override val methodName: String,
      override val lineNumber: Int?,
      override val column: Int?,
  ) : ParsedError.StackFrame

  @DoNotStripAny
  private data class ParsedErrorImpl(
      override val message: String,
      override val originalMessage: String?,
      override val name: String?,
      override val componentStack: String?,
      override val stack: ArrayList<ParsedStackFrameImpl>,
      override val id: Int,
      override val isFatal: Boolean,
      override val extraData: ReadableNativeMap,
  ) : ParsedError

  public fun reportJsException(errorMap: ParsedError)
}
