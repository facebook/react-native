/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.common.ReactConstants;

public class ExceptionsManagerModule extends BaseJavaModule {

  static private final Pattern mJsModuleIdPattern = Pattern.compile("(?:^|[/\\\\])(\\d+\\.js)$");
  private final DevSupportManager mDevSupportManager;

  public ExceptionsManagerModule(DevSupportManager devSupportManager) {
    mDevSupportManager = devSupportManager;
  }

  @Override
  public String getName() {
    return "RKExceptionsManager";
  }

  // If the file name of a stack frame is numeric (+ ".js"), we assume it's a lazily injected module
  // coming from a "random access bundle". We are using special source maps for these bundles, so
  // that we can symbolicate stack traces for multiple injected files with a single source map.
  // We have to include the module id in the stack for that, though. The ".js" suffix is kept to
  // avoid ambiguities between "module-id:line" and "line:column".
  static private String stackFrameToModuleId(ReadableMap frame) {
    if (frame.hasKey("file") &&
        !frame.isNull("file") &&
        frame.getType("file") == ReadableType.String) {
      final Matcher matcher = mJsModuleIdPattern.matcher(frame.getString("file"));
      if (matcher.find()) {
        return matcher.group(1) + ":";
      }
    }
    return "";
  }

  private String stackTraceToString(String message, ReadableArray stack) {
    StringBuilder stringBuilder = new StringBuilder(message).append(", stack:\n");
    for (int i = 0; i < stack.size(); i++) {
      ReadableMap frame = stack.getMap(i);
      stringBuilder
          .append(frame.getString("methodName"))
          .append("@")
          .append(stackFrameToModuleId(frame))
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

  @ReactMethod
  public void reportFatalException(String title, ReadableArray details, int exceptionId) {
    showOrThrowError(title, details, exceptionId);
  }

  @ReactMethod
  public void reportSoftException(String title, ReadableArray details, int exceptionId) {
    FLog.e(ReactConstants.TAG, stackTraceToString(title, details));
  }

  private void showOrThrowError(String title, ReadableArray details, int exceptionId) {
    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.showNewJSError(title, details, exceptionId);
    } else {
      throw new JavascriptException(stackTraceToString(title, details));
    }
  }

  @ReactMethod
  public void updateExceptionMessage(String title, ReadableArray details, int exceptionId) {
    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.updateJSError(title, details, exceptionId);
    }
  }

  @ReactMethod
  public void dismissRedbox() {
    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.hideRedboxDialog();
    }
  }
}
