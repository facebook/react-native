/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
import java.lang.reflect.Method;

@DoNotStrip
@LegacyArchitecture
public class ReactCxxErrorHandler {
  static {
    LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled(
        "ReactCxxErrorHandler", LegacyArchitectureLogLevel.WARNING);
  }

  private static Method mHandleErrorFunc;
  private static Object mObject;

  @DoNotStrip
  public static void setHandleErrorFunc(Object object, Method handleErrorFunc) {
    mObject = object;
    mHandleErrorFunc = handleErrorFunc;
  }

  @DoNotStrip
  // For use from within the C++ JReactCxxErrorHandler
  private static void handleError(final String message) {
    if (mHandleErrorFunc != null) {
      try {
        Object[] parameters = new Object[1];
        parameters[0] = new Exception(message);
        mHandleErrorFunc.invoke(mObject, parameters);
      } catch (Exception e) {
        FLog.e("ReactCxxErrorHandler", "Failed to invoke error handler function", e);
      }
    }
  }
}
