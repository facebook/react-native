/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static com.facebook.react.devsupport.StackTraceHelper.COLUMN_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.COMPONENT_STACK_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.EXTRA_DATA_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.FILE_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.ID_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.IS_FATAL_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.LINE_NUMBER_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.MESSAGE_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.METHOD_NAME_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.NAME_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.ORIGINAL_MESSAGE_KEY;
import static com.facebook.react.devsupport.StackTraceHelper.STACK_KEY;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler;
import java.util.ArrayList;
import java.util.List;

@Nullsafe(Nullsafe.Mode.LOCAL)
@ThreadSafe
final class ReactInstanceProcessedErrorConverter {

  /**
   * This method can be moved inside {@code StackTraceHelper} as soon as {@code ReactInstance.java}
   * is converted to Kotlin. It needs now to be in Java because [ProcessedError] is {@code internal}
   * but can still be accessed by Java callers (like {@code ReactInstance}). Making {@code
   * ProcessedError} public would increase the API size which we don't want.
   */
  @UnstableReactNativeAPI
  static JavaOnlyMap convertProcessedError(ReactJsExceptionHandler.ProcessedError error) {
    List<ReactJsExceptionHandler.ProcessedError.StackFrame> frames = error.getStack();
    List<ReadableMap> readableMapList = new ArrayList<>();
    for (ReactJsExceptionHandler.ProcessedError.StackFrame frame : frames) {
      JavaOnlyMap map = new JavaOnlyMap();
      if (frame.getColumn() != null) {
        map.putDouble(COLUMN_KEY, frame.getColumn());
      }
      if (frame.getLineNumber() != null) {
        map.putDouble(LINE_NUMBER_KEY, frame.getLineNumber());
      }
      map.putString(FILE_KEY, frame.getFile());
      map.putString(METHOD_NAME_KEY, frame.getMethodName());
      readableMapList.add(map);
    }

    JavaOnlyMap data = new JavaOnlyMap();
    data.putString(MESSAGE_KEY, error.getMessage());
    if (error.getOriginalMessage() != null) {
      data.putString(ORIGINAL_MESSAGE_KEY, error.getOriginalMessage());
    }
    if (error.getName() != null) {
      data.putString(NAME_KEY, error.getName());
    }
    if (error.getComponentStack() != null) {
      data.putString(COMPONENT_STACK_KEY, error.getComponentStack());
    }
    data.putArray(STACK_KEY, JavaOnlyArray.from(readableMapList));
    data.putInt(ID_KEY, error.getId());
    data.putBoolean(IS_FATAL_KEY, error.isFatal());
    data.putMap(EXTRA_DATA_KEY, error.getExtraData());

    return data;
  }
}
