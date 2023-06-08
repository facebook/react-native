/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.common.logging

import java.util.*

class FakeLoggingDelegate : LoggingDelegate {
  class LogLine(val priority: Int, val tag: String, val msg: String, val tr: Throwable? = null)

  private var minLogLevel = FLog.VERBOSE
  private val logs = ArrayList<LogLine>()

  fun logContains(priority: Int, tag: String, throwMsg: String?): Boolean {
    for (line in logs) {
      if (matchLogQuery(priority, tag, throwMsg, line)) {
        return true
      }
    }
    return false
  }

  /** LoggingDelegate API */
  override fun getMinimumLoggingLevel(): Int = minLogLevel

  override fun setMinimumLoggingLevel(level: Int) {
    minLogLevel = level
  }

  override fun isLoggable(level: Int): Boolean = level >= minLogLevel

  private fun logImpl(priority: Int, tag: String, msg: String, tr: Throwable? = null) {
    if (isLoggable(priority)) {
      logs.add(LogLine(priority, tag, msg, tr))
    }
  }

  override fun log(priority: Int, tag: String, msg: String) = logImpl(priority, tag, msg, null)

  override fun d(tag: String, msg: String, tr: Throwable) = logImpl(DEBUG, tag, msg, tr)

  override fun d(tag: String, msg: String) = logImpl(DEBUG, tag, msg, null)

  override fun e(tag: String, msg: String, tr: Throwable) = logImpl(ERROR, tag, msg, tr)

  override fun e(tag: String, msg: String) = logImpl(ERROR, tag, msg, null)

  override fun i(tag: String, msg: String, tr: Throwable) = logImpl(INFO, tag, msg, tr)

  override fun i(tag: String, msg: String) = logImpl(INFO, tag, msg, null)

  override fun v(tag: String, msg: String, tr: Throwable) = logImpl(VERBOSE, tag, msg, tr)

  override fun v(tag: String, msg: String) = logImpl(VERBOSE, tag, msg, null)

  override fun w(tag: String, msg: String, tr: Throwable) = logImpl(WARN, tag, msg, tr)

  override fun w(tag: String, msg: String) = logImpl(WARN, tag, msg, null)

  override fun wtf(tag: String, msg: String, tr: Throwable) = logImpl(WTF, tag, msg, tr)

  override fun wtf(tag: String, msg: String) = logImpl(WTF, tag, msg, null)

  companion object {
    const val ASSERT = FLog.ASSERT
    const val DEBUG = FLog.DEBUG
    const val ERROR = FLog.ERROR
    const val INFO = FLog.INFO
    const val VERBOSE = FLog.VERBOSE
    const val WARN = FLog.WARN

    /**
     * There is no log level for Terrible Failures (we emit them at the Error Log-level), but to
     * test that WTF errors are being logged, we are making up a new log level here, guaranteed to
     * be larger than any of the other log levels.
     */
    @JvmField val WTF = 1 + (listOf(ASSERT, DEBUG, ERROR, INFO, VERBOSE, WARN).maxOrNull() ?: 0)

    /** Test Harness */
    private fun matchLogQuery(
        priority: Int,
        tag: String,
        throwMsg: String?,
        line: LogLine
    ): Boolean =
        priority == line.priority &&
            tag == line.tag &&
            (throwMsg == null || throwMsg == line.tr?.message)
  }
}
