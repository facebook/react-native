/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import java.io.File;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.common.ReactConstants;

public class ExceptionsManagerModule extends BaseJavaModule {

  private final DevSupportManager mDevSupportManager;

  public ExceptionsManagerModule(DevSupportManager devSupportManager) {
    mDevSupportManager = devSupportManager;
  }

  @Override
  public String getName() {
    return "RKExceptionsManager";
  }

  private String stackTraceToString(ReadableArray stack) {
    StringBuilder stringBuilder = new StringBuilder();
    for (int i = 0; i < stack.size(); i++) {
      ReadableMap frame = stack.getMap(i);
      stringBuilder.append(frame.getString("methodName"));
      stringBuilder.append("\n    ");
      stringBuilder.append(new File(frame.getString("file")).getName());
      stringBuilder.append(":");
      stringBuilder.append(frame.getInt("lineNumber"));
      if (frame.hasKey("column") && !frame.isNull("column")) {
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
    FLog.e(ReactConstants.TAG, title + "\n" + stackTraceToString(details));
  }

  private void showOrThrowError(String title, ReadableArray details, int exceptionId) {
    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.showNewJSError(title, details, exceptionId);
    } else {
      throw new JavascriptException(stackTraceToString(details));
    }
  }

  @ReactMethod
  public void updateExceptionMessage(String title, ReadableArray details, int exceptionId) {
    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.updateJSError(title, details, exceptionId);
    }
  }
}
