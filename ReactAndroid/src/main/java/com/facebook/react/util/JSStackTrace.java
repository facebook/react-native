/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.util;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JSStackTrace {

  private static final String LINE_NUMBER_KEY = "lineNumber";
  private static final Pattern FILE_ID_PATTERN =
      Pattern.compile("\\b((?:seg-\\d+(?:_\\d+)?|\\d+)\\.js)");
  private static final String FILE_KEY = "file";
  private static final String COLUMN_KEY = "column";
  private static final String METHOD_NAME_KEY = "methodName";

  public static String format(String message, ReadableArray stack) {
    StringBuilder stringBuilder = new StringBuilder(message).append(", stack:\n");
    for (int i = 0; i < stack.size(); i++) {
      ReadableMap frame = stack.getMap(i);
      stringBuilder.append(frame.getString(METHOD_NAME_KEY)).append("@").append(parseFileId(frame));

      if (frame.hasKey(LINE_NUMBER_KEY)
          && !frame.isNull(LINE_NUMBER_KEY)
          && frame.getType(LINE_NUMBER_KEY) == ReadableType.Number) {
        stringBuilder.append(frame.getInt(LINE_NUMBER_KEY));
      } else {
        stringBuilder.append(-1);
      }

      if (frame.hasKey(COLUMN_KEY)
          && !frame.isNull(COLUMN_KEY)
          && frame.getType(COLUMN_KEY) == ReadableType.Number) {
        stringBuilder.append(":").append(frame.getInt(COLUMN_KEY));
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
    if (frame.hasKey(FILE_KEY)
        && !frame.isNull(FILE_KEY)
        && frame.getType(FILE_KEY) == ReadableType.String) {
      String file = frame.getString(FILE_KEY);
      if (file != null) {
        final Matcher matcher = FILE_ID_PATTERN.matcher(file);
        if (matcher.find()) {
          return matcher.group(1) + ":";
        }
      }
    }
    return "";
  }
}
