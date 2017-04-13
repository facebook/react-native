/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.File;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.devsupport.interfaces.StackFrame;

/**
 * Helper class converting JS and Java stack traces into arrays of {@link StackFrame} objects.
 */
public class StackTraceHelper {

  public static final java.lang.String COLUMN_KEY = "column";
  public static final java.lang.String LINE_NUMBER_KEY = "lineNumber";

  /**
   * Represents a generic entry in a stack trace, be it originally from JS or Java.
   */
  public static class StackFrameImpl implements StackFrame {
    private final String mFile;
    private final String mMethod;
    private final int mLine;
    private final int mColumn;
    private final String mFileName;

    private StackFrameImpl(String file, String method, int line, int column) {
      mFile = file;
      mMethod = method;
      mLine = line;
      mColumn = column;
      mFileName = file != null ? new File(file).getName() : "";
    }

    private StackFrameImpl(String file, String fileName, String method, int line, int column) {
      mFile = file;
      mFileName = fileName;
      mMethod = method;
      mLine = line;
      mColumn = column;
    }

    /**
     * Get the file this stack frame points to.
     *
     * JS traces return the full path to the file here, while Java traces only return the file name
     * (the path is not known).
     */
    public String getFile() {
      return mFile;
    }

    /**
     * Get the name of the method this frame points to.
     */
    public String getMethod() {
      return mMethod;
    }

    /**
     * Get the line number this frame points to in the file returned by {@link #getFile()}.
     */
    public int getLine() {
      return mLine;
    }

    /**
     * Get the column this frame points to in the file returned by {@link #getFile()}.
     */
    public int getColumn() {
      return mColumn;
    }

    /**
     * Get just the name of the file this frame points to.
     *
     * For JS traces this is different from {@link #getFile()} in that it only returns the file
     * name, not the full path. For Java traces there is no difference.
     */
    public String getFileName() {
      return mFileName;
    }
  }

  /**
   * Convert a JavaScript stack trace (see {@code parseErrorStack} JS module) to an array of
   * {@link StackFrame}s.
   */
  public static StackFrame[] convertJsStackTrace(@Nullable ReadableArray stack) {
    int size = stack != null ? stack.size() : 0;
    StackFrame[] result = new StackFrame[size];
    for (int i = 0; i < size; i++) {
      ReadableMap frame = stack.getMap(i);
      String methodName = frame.getString("methodName");
      String fileName = frame.getString("file");
      int lineNumber = -1;
      if (frame.hasKey(LINE_NUMBER_KEY) && !frame.isNull(LINE_NUMBER_KEY)) {
        lineNumber = frame.getInt(LINE_NUMBER_KEY);
      }
      int columnNumber = -1;
      if (frame.hasKey(COLUMN_KEY) && !frame.isNull(COLUMN_KEY)) {
        columnNumber = frame.getInt(COLUMN_KEY);
      }
      result[i] = new StackFrameImpl(fileName, methodName, lineNumber, columnNumber);
    }
    return result;
  }

  /**
   * Convert a {@link Throwable} to an array of {@link StackFrame}s.
   */
  public static StackFrame[] convertJavaStackTrace(Throwable exception) {
    StackTraceElement[] stackTrace = exception.getStackTrace();
    StackFrame[] result = new StackFrame[stackTrace.length];
    for (int i = 0; i < stackTrace.length; i++) {
      result[i] = new StackFrameImpl(
          stackTrace[i].getClassName(),
          stackTrace[i].getFileName(),
          stackTrace[i].getMethodName(),
          stackTrace[i].getLineNumber(),
          -1);
    }
    return result;
  }

  /**
   * Format a {@link StackFrame} to a String (method name is not included).
   */
  public static String formatFrameSource(StackFrame frame) {
    StringBuilder lineInfo = new StringBuilder();
    lineInfo.append(frame.getFileName());
    final int line = frame.getLine();
    if (line > 0) {
      lineInfo.append(":").append(line);
      final int column = frame.getColumn();
      if (column > 0) {
        lineInfo.append(":").append(column);
      }
    }
    return lineInfo.toString();
  }

  /**
   * Format an array of {@link StackFrame}s with the error title to a String.
   */
  public static String formatStackTrace(String title, StackFrame[] stack) {
    StringBuilder stackTrace = new StringBuilder();
    stackTrace.append(title).append("\n");
    for (StackFrame frame: stack) {
      stackTrace.append(frame.getMethod())
          .append("\n")
          .append("    ")
          .append(formatFrameSource(frame))
          .append("\n");
    }

    return stackTrace.toString();
  }
}
