/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util;

import android.util.Log;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.ReactConstants;

/** Logging wrapper for FLog with LogBox support. */
public class RNLog {
  public static final int MINIMUM_LEVEL_FOR_UI = Log.WARN;

  public static final int LOG = Log.VERBOSE;

  public static final int TRACE = Log.DEBUG;

  public static final int ADVICE = Log.INFO;

  public static final int WARN = Log.WARN;

  public static final int ERROR = Log.ERROR;

  /**
   * Log a log level message tagged as React Native to the console.
   *
   * @param message The message to log.
   */
  public static void l(String message) {
    FLog.i(ReactConstants.TAG, message);
  }

  /**
   * Log a trace level message tagged as React Native to the console.
   *
   * @param message The message to log.
   */
  public static void t(String message) {
    FLog.i(ReactConstants.TAG, message);
  }

  /**
   * Log a warning level message tagged as React Native to the console. This warning will not be
   * shown in LogBox.
   *
   * @param message The message to log.
   */
  public static void a(String message) {
    FLog.w(ReactConstants.TAG, "(ADVICE)" + message);
  }

  /**
   * Log a warning level message tagged as React Native to the console and display in the app.
   *
   * @param context The React context of the application use to display the warning.
   * @param message The message to log.
   */
  public static void w(ReactContext context, String message) {
    RNLog.logInternal(context, message, WARN);
    FLog.w(ReactConstants.TAG, message);
  }

  /**
   * Log an error level message tagged as React Native to the console and display in the app.
   *
   * @param context The React context of the application use to display the error.
   * @param message The message to log.
   */
  public static void e(ReactContext context, String message) {
    RNLog.logInternal(context, message, ERROR);
    FLog.e(ReactConstants.TAG, message);
  }

  /**
   * Log an error level message tagged as React Native to the console. This error will not be shown
   * in LogBox.
   *
   * @param message The message to log.
   */
  public static void e(String message) {
    FLog.e(ReactConstants.TAG, message);
  }

  private static void logInternal(ReactContext context, String message, int level) {
    if (level >= MINIMUM_LEVEL_FOR_UI) {
      if (context != null && message != null) {
        context.getJSModule(RCTLog.class).logIfNoNativeHook(levelToString(level), message);
      }
    }
  }

  private static String levelToString(int level) {
    switch (level) {
      case LOG:
        {
          return "log";
        }
      case TRACE:
        {
          return "log";
        }
      case ADVICE:
        {
          return "warn";
        }
      case WARN:
        {
          return "warn";
        }
      case ERROR:
        {
          return "error";
        }
      default:
        {
          return "none";
        }
    }
  }
}
