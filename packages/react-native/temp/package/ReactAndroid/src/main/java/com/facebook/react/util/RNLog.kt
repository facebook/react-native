/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util

import android.util.Log
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants

/** Logging wrapper for FLog with LogBox support. */
public object RNLog {

  public const val MINIMUM_LEVEL_FOR_UI: Int = Log.WARN
  public const val LOG: Int = Log.VERBOSE
  public const val TRACE: Int = Log.DEBUG
  public const val ADVICE: Int = Log.INFO
  public const val WARN: Int = Log.WARN
  public const val ERROR: Int = Log.ERROR

  /**
   * Log a log level message tagged as React Native to the console.
   *
   * @param message The message to log.
   */
  @JvmStatic
  public fun l(message: String) {
    FLog.i(ReactConstants.TAG, message)
  }

  /**
   * Log a trace level message tagged as React Native to the console.
   *
   * @param message The message to log.
   */
  @JvmStatic
  public fun t(message: String) {
    FLog.i(ReactConstants.TAG, message)
  }

  /**
   * Log a warning level message tagged as React Native to the console. This warning will not be
   * shown in LogBox.
   *
   * @param message The message to log.
   */
  @JvmStatic
  public fun a(message: String) {
    FLog.w(ReactConstants.TAG, "(ADVICE)$message")
  }

  /**
   * Log a warning level message tagged as React Native to the console and display in the app.
   *
   * @param context The React context of the application use to display the warning.
   * @param message The message to log.
   */
  @JvmStatic
  public fun w(context: ReactContext?, message: String) {
    logInternal(context, message, WARN)
    FLog.w(ReactConstants.TAG, message)
  }

  /**
   * Log an error level message tagged as React Native to the console and display in the app.
   *
   * @param context The React context of the application use to display the error.
   * @param message The message to log.
   */
  @JvmStatic
  public fun e(context: ReactContext?, message: String) {
    logInternal(context, message, ERROR)
    FLog.e(ReactConstants.TAG, message)
  }

  /**
   * Log an error level message tagged as React Native to the console. This error will not be shown
   * in LogBox.
   *
   * @param message The message to log.
   */
  @JvmStatic
  public fun e(message: String) {
    FLog.e(ReactConstants.TAG, message)
  }

  private fun logInternal(context: ReactContext?, message: String?, level: Int) {
    if (level >= MINIMUM_LEVEL_FOR_UI) {
      if (context?.hasActiveReactInstance() == true && message != null) {
        context.getJSModule(RCTLog::class.java).logIfNoNativeHook(levelToString(level), message)
      }
    }
  }

  private fun levelToString(level: Int): String =
      when (level) {
        LOG,
        TRACE -> "log"
        ADVICE,
        WARN -> "warn"
        ERROR -> "error"
        else -> "none"
      }
}
