/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.devsupport.interfaces.StackFrame;
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler.ParsedError;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Helper class converting JS and Java stack traces into arrays of {@link StackFrame} objects. */
public class StackTraceHelper {

  public static final String COLUMN_KEY = "column";
  public static final String LINE_NUMBER_KEY = "lineNumber";
  public static final String FILE_KEY = "file";
  public static final String METHOD_NAME_KEY = "methodName";

  public static final String MESSAGE_KEY = "message";
  public static final String STACK_KEY = "stack";
  public static final String ID_KEY = "id";
  public static final String IS_FATAL_KEY = "isFatal";

  private static final Pattern STACK_FRAME_PATTERN1 =
      Pattern.compile("^(?:(.*?)@)?(.*?)\\:([0-9]+)\\:([0-9]+)$");
  private static final Pattern STACK_FRAME_PATTERN2 =
      Pattern.compile("\\s*(?:at)\\s*(.+?)\\s*[@(](.*):([0-9]+):([0-9]+)[)]$");

  /** Represents a generic entry in a stack trace, be it originally from JS or Java. */
  public static class StackFrameImpl implements StackFrame {
    private final String mFile;
    private final String mMethod;
    private final int mLine;
    private final int mColumn;
    private final String mFileName;
    private final boolean mIsCollapsed;

    private StackFrameImpl(String file, String method, int line, int column, boolean isCollapsed) {
      mFile = file;
      mMethod = method;
      mLine = line;
      mColumn = column;
      mFileName = file != null ? new File(file).getName() : "";
      mIsCollapsed = isCollapsed;
    }

    private StackFrameImpl(String file, String method, int line, int column) {
      this(file, method, line, column, false);
    }

    private StackFrameImpl(String file, String fileName, String method, int line, int column) {
      mFile = file;
      mFileName = fileName;
      mMethod = method;
      mLine = line;
      mColumn = column;
      mIsCollapsed = false;
    }

    /**
     * Get the file this stack frame points to.
     *
     * <p>JS traces return the full path to the file here, while Java traces only return the file
     * name (the path is not known).
     */
    public String getFile() {
      return mFile;
    }

    /** Get the name of the method this frame points to. */
    public String getMethod() {
      return mMethod;
    }

    /** Get the line number this frame points to in the file returned by {@link #getFile()}. */
    public int getLine() {
      return mLine;
    }

    /** Get the column this frame points to in the file returned by {@link #getFile()}. */
    public int getColumn() {
      return mColumn;
    }

    /**
     * Get just the name of the file this frame points to.
     *
     * <p>For JS traces this is different from {@link #getFile()} in that it only returns the file
     * name, not the full path. For Java traces there is no difference.
     */
    public String getFileName() {
      return mFileName;
    }

    public boolean isCollapsed() {
      return mIsCollapsed;
    }

    /** Convert the stack frame to a JSON representation. */
    public JSONObject toJSON() {
      return new JSONObject(
          MapBuilder.of(
              "file", getFile(),
              "methodName", getMethod(),
              "lineNumber", getLine(),
              "column", getColumn(),
              "collapse", isCollapsed()));
    }
  }

  /**
   * Convert a JavaScript stack trace (see {@code parseErrorStack} JS module) to an array of {@link
   * StackFrame}s.
   */
  public static StackFrame[] convertJsStackTrace(@Nullable ReadableArray stack) {
    int size = stack != null ? stack.size() : 0;
    StackFrame[] result = new StackFrame[size];
    for (int i = 0; i < size; i++) {
      ReadableType type = stack.getType(i);
      if (type == ReadableType.Map) {
        ReadableMap frame = stack.getMap(i);
        String methodName = frame.getString("methodName");
        String fileName = frame.getString("file");
        boolean collapse =
            frame.hasKey("collapse") && !frame.isNull("collapse") && frame.getBoolean("collapse");
        int lineNumber = -1;
        if (frame.hasKey(LINE_NUMBER_KEY) && !frame.isNull(LINE_NUMBER_KEY)) {
          lineNumber = frame.getInt(LINE_NUMBER_KEY);
        }
        int columnNumber = -1;
        if (frame.hasKey(COLUMN_KEY) && !frame.isNull(COLUMN_KEY)) {
          columnNumber = frame.getInt(COLUMN_KEY);
        }
        result[i] = new StackFrameImpl(fileName, methodName, lineNumber, columnNumber, collapse);
      } else if (type == ReadableType.String) {
        result[i] = new StackFrameImpl(null, stack.getString(i), -1, -1);
      }
    }
    return result;
  }

  /**
   * Convert a JavaScript stack trace (see {@code parseErrorStack} JS module) to an array of {@link
   * StackFrame}s.
   */
  public static StackFrame[] convertJsStackTrace(JSONArray stack) {
    int size = stack != null ? stack.length() : 0;
    StackFrame[] result = new StackFrame[size];
    try {
      for (int i = 0; i < size; i++) {
        JSONObject frame = stack.getJSONObject(i);
        String methodName = frame.getString("methodName");
        String fileName = frame.getString("file");
        int lineNumber = -1;
        if (frame.has(LINE_NUMBER_KEY) && !frame.isNull(LINE_NUMBER_KEY)) {
          lineNumber = frame.getInt(LINE_NUMBER_KEY);
        }
        int columnNumber = -1;
        if (frame.has(COLUMN_KEY) && !frame.isNull(COLUMN_KEY)) {
          columnNumber = frame.getInt(COLUMN_KEY);
        }
        boolean collapse =
            frame.has("collapse") && !frame.isNull("collapse") && frame.getBoolean("collapse");
        result[i] = new StackFrameImpl(fileName, methodName, lineNumber, columnNumber, collapse);
      }
    } catch (JSONException exception) {
      throw new RuntimeException(exception);
    }
    return result;
  }

  /** Convert a JavaScript stack trace to an array of {@link StackFrame}s. */
  public static StackFrame[] convertJsStackTrace(String stack) {
    String[] stackTrace = stack.split("\n");
    StackFrame[] result = new StackFrame[stackTrace.length];
    for (int i = 0; i < stackTrace.length; ++i) {
      Matcher matcher1 = STACK_FRAME_PATTERN1.matcher(stackTrace[i]);
      Matcher matcher2 = STACK_FRAME_PATTERN2.matcher(stackTrace[i]);
      Matcher matcher;
      if (matcher2.find()) {
        matcher = matcher2;
      } else if (matcher1.find()) {
        matcher = matcher1;
      } else {
        result[i] = new StackFrameImpl(null, stackTrace[i], -1, -1);
        continue;
      }
      result[i] =
          new StackFrameImpl(
              matcher.group(2),
              matcher.group(1) == null ? "(unknown)" : matcher.group(1),
              Integer.parseInt(matcher.group(3)),
              Integer.parseInt(matcher.group(4)));
    }
    return result;
  }

  /** Convert a {@link Throwable} to an array of {@link StackFrame}s. */
  public static StackFrame[] convertJavaStackTrace(Throwable exception) {
    StackTraceElement[] stackTrace = exception.getStackTrace();
    StackFrame[] result = new StackFrame[stackTrace.length];
    for (int i = 0; i < stackTrace.length; i++) {
      result[i] =
          new StackFrameImpl(
              stackTrace[i].getClassName(),
              stackTrace[i].getFileName(),
              stackTrace[i].getMethodName(),
              stackTrace[i].getLineNumber(),
              -1);
    }
    return result;
  }

  /** Format a {@link StackFrame} to a String (method name is not included). */
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

  /** Format an array of {@link StackFrame}s with the error title to a String. */
  public static String formatStackTrace(String title, StackFrame[] stack) {
    StringBuilder stackTrace = new StringBuilder();
    stackTrace.append(title).append("\n");
    for (StackFrame frame : stack) {
      stackTrace
          .append(frame.getMethod())
          .append("\n")
          .append("    ")
          .append(formatFrameSource(frame))
          .append("\n");
    }

    return stackTrace.toString();
  }

  public static JavaOnlyMap convertParsedError(ParsedError error) {
    List<ParsedError.StackFrame> frames = error.getFrames();
    List<ReadableMap> readableMapList = new ArrayList<>();
    for (ParsedError.StackFrame frame : frames) {
      JavaOnlyMap map = new JavaOnlyMap();
      map.putDouble(COLUMN_KEY, frame.getColumnNumber());
      map.putDouble(LINE_NUMBER_KEY, frame.getLineNumber());
      map.putString(FILE_KEY, (String) frame.getFileName());
      map.putString(METHOD_NAME_KEY, (String) frame.getMethodName());
      readableMapList.add(map);
    }

    JavaOnlyMap data = new JavaOnlyMap();
    data.putString(MESSAGE_KEY, error.getMessage());
    data.putArray(STACK_KEY, JavaOnlyArray.from(readableMapList));
    data.putInt(ID_KEY, error.getExceptionId());
    data.putBoolean(IS_FATAL_KEY, error.isFatal());

    return data;
  }
}
