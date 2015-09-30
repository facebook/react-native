/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import java.io.File;

import android.text.Html;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Helper class for displaying errors in an eye-catching form (red box).
 */
/* package */ class ExceptionFormatterHelper {

  private static String getStackTraceHtmlComponent(
      String methodName, String filename, int lineNumber, int columnNumber) {
    StringBuilder stringBuilder = new StringBuilder();
    methodName = methodName.replace("<", "&lt;").replace(">", "&gt;");
    stringBuilder.append("<font color=#FDE5E5>")
        .append(methodName)
        .append("</font><br /><font color=#F9B3B3>")
        .append(filename)
        .append(":")
        .append(lineNumber);
    if (columnNumber != -1) {
      stringBuilder
          .append(":")
          .append(columnNumber);
    }
    stringBuilder.append("</font><br /><br />");
    return stringBuilder.toString();
  }

  public static CharSequence jsStackTraceToHtml(ReadableArray stack) {
    StringBuilder stringBuilder = new StringBuilder();
    for (int i = 0; i < stack.size(); i++) {
      ReadableMap frame = stack.getMap(i);
      String methodName = frame.getString("methodName");
      String fileName = new File(frame.getString("file")).getName();
      int lineNumber = frame.getInt("lineNumber");
      int columnNumber = -1;
      if (frame.hasKey("column") && !frame.isNull("column")) {
        columnNumber = frame.getInt("column");
      }
      stringBuilder.append(getStackTraceHtmlComponent(
              methodName, fileName, lineNumber, columnNumber));
    }
    return Html.fromHtml(stringBuilder.toString());
  }

  public static CharSequence javaStackTraceToHtml(StackTraceElement[] stack) {
    StringBuilder stringBuilder = new StringBuilder();
    for (int i = 0; i< stack.length; i++) {
      stringBuilder.append(getStackTraceHtmlComponent(
              stack[i].getMethodName(), stack[i].getFileName(), stack[i].getLineNumber(), -1));

    }
    return Html.fromHtml(stringBuilder.toString());
  }

  public static CharSequence debugServerExcStackTraceToHtml(DebugServerException e) {
    String s = getStackTraceHtmlComponent("", e.fileName, e.lineNumber, e.column);
    return Html.fromHtml(s);
  }

}
