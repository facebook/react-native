/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeExceptionsManagerSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.JavascriptException;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.util.ExceptionDataHelper;
import com.facebook.react.util.JSStackTrace;

@ReactModule(name = ExceptionsManagerModule.NAME)
public class ExceptionsManagerModule extends NativeExceptionsManagerSpec {

  public static final String NAME = "ExceptionsManager";

  private final DevSupportManager mDevSupportManager;

  public ExceptionsManagerModule(DevSupportManager devSupportManager) {
    super(null);
    mDevSupportManager = devSupportManager;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void reportFatalException(String message, ReadableArray stack, double idDouble) {
    int id = (int) idDouble;

    JavaOnlyMap data = new JavaOnlyMap();
    data.putString("message", message);
    data.putArray("stack", stack);
    data.putInt("id", id);
    data.putBoolean("isFatal", true);
    reportException(data);
  }

  @Override
  public void reportSoftException(String message, ReadableArray stack, double idDouble) {
    int id = (int) idDouble;

    JavaOnlyMap data = new JavaOnlyMap();
    data.putString("message", message);
    data.putArray("stack", stack);
    data.putInt("id", id);
    data.putBoolean("isFatal", false);
    reportException(data);
  }

  @Override
  public void reportException(ReadableMap data) {
    String message = data.hasKey("message") ? data.getString("message") : "";
    ReadableArray stack = data.hasKey("stack") ? data.getArray("stack") : Arguments.createArray();
    boolean isFatal = data.hasKey("isFatal") ? data.getBoolean("isFatal") : false;

    String extraDataAsJson = ExceptionDataHelper.getExtraDataAsJson(data);
    if (isFatal) {
      throw new JavascriptException(JSStackTrace.format(message, stack))
          .setExtraDataAsJson(extraDataAsJson);
    } else {
      FLog.e(ReactConstants.TAG, JSStackTrace.format(message, stack));
      if (extraDataAsJson != null) {
        FLog.d(ReactConstants.TAG, "extraData: %s", extraDataAsJson);
      }
    }
  }

  @Override
  public void updateExceptionMessage(
      String title, ReadableArray details, double exceptionIdDouble) {
    int exceptionId = (int) exceptionIdDouble;

    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.updateJSError(title, details, exceptionId);
    }
  }

  @Override
  public void dismissRedbox() {
    if (mDevSupportManager.getDevSupportEnabled()) {
      mDevSupportManager.hideRedboxDialog();
    }
  }
}
