/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

public class JSStackTrace {

  private static final Pattern FILE_ID_PATTERN = Pattern.compile("\\b((?:seg-\\d+(?:_\\d+)?|\\d+)\\.js)");

  public static String format(String message, ReadableArray stack) {
    StringBuilder stringBuilder = new StringBuilder(message).append(", stack:\n");
    for (int i = 0; i < stack.size(); i++) {
      ReadableMap frame = stack.getMap(i);
      stringBuilder
        .append(frame.getString("methodName"))
        .append("@")
        .append(parseFileId(frame))
        .append(frame.getInt("lineNumber"));
      if (frame.hasKey("column") &&
        !frame.isNull("column") &&
        frame.getType("column") == ReadableType.Number) {
        stringBuilder
          .append(":")
          .append(frame.getInt("column"));
      }
      stringBuilder.append("\n");
    }
    return stringBuilder.toString();
  }

  // Besides a regular bundle (e.g. "bundle.js"), a stack frame can be produced by:
  // 1) "random access bundle (RAM)", e.g. "1.js", where "1" is a module name
  // 2) "segment file", e.g. "seg-1.js", where "1" is a segment name
  // 3) "RAM segment file", e.g. "seg-1_2.js", where "1" is a segment name and "2" is a module name
  // We are using a special source map format for such cases, so that we could symbolicate
  // stack traces with a single source map file.
  // NOTE: The ".js" suffix is kept to avoid ambiguities between "module-id:line" and "line:column".
  private static String parseFileId(ReadableMap frame) {
    if (frame.hasKey("file") &&
        !frame.isNull("file") &&
        frame.getType("file") == ReadableType.String) {
      final Matcher matcher = FILE_ID_PATTERN.matcher(frame.getString("file"));
      if (matcher.find()) {
        return matcher.group(1) + ":";
      }
    }
    return "";
  }
}
