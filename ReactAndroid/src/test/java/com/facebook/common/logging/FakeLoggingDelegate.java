/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.common.logging;

import androidx.annotation.Nullable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;

public final class FakeLoggingDelegate implements LoggingDelegate {

  public static final class LogLine {
    public final int priority;
    public final String tag;
    public final String msg;
    public final @Nullable Throwable tr;

    private LogLine(int priority, String tag, String msg, @Nullable Throwable tr) {

      this.priority = priority;
      this.tag = tag;
      this.msg = msg;
      this.tr = tr;
    }
  }

  public static final int ASSERT = FLog.ASSERT;
  public static final int DEBUG = FLog.DEBUG;
  public static final int ERROR = FLog.ERROR;
  public static final int INFO = FLog.INFO;
  public static final int VERBOSE = FLog.VERBOSE;
  public static final int WARN = FLog.WARN;

  /**
   * There is no log level for Terrible Failures (we emit them at the Error Log-level), but to test
   * that WTF errors are being logged, we are making up a new log level here, guaranteed to be
   * larger than any of the other log levels.
   */
  public static final int WTF =
      1 + Collections.max(Arrays.asList(ASSERT, DEBUG, ERROR, INFO, VERBOSE, WARN));

  private int mMinLogLevel = FLog.VERBOSE;
  private final ArrayList<LogLine> mLogs = new ArrayList<>();

  /** Test Harness */
  private static boolean matchLogQuery(
      int priority, String tag, @Nullable String throwMsg, LogLine line) {
    return priority == line.priority
        && tag.equals(line.tag)
        && (throwMsg == null || throwMsg.equals(line.tr.getMessage()));
  }

  public boolean logContains(int priority, String tag, String throwMsg) {
    for (FakeLoggingDelegate.LogLine line : mLogs) {
      if (matchLogQuery(priority, tag, throwMsg, line)) {
        return true;
      }
    }

    return false;
  }

  /** LoggingDelegate API */
  public int getMinimumLoggingLevel() {
    return mMinLogLevel;
  }

  public void setMinimumLoggingLevel(int level) {
    mMinLogLevel = level;
  }

  public boolean isLoggable(int level) {
    return level >= mMinLogLevel;
  }

  private void logImpl(int priority, String tag, String msg, Throwable tr) {
    if (isLoggable(priority)) {
      mLogs.add(new LogLine(priority, tag, msg, tr));
    }
  }

  public void log(int priority, String tag, String msg) {
    logImpl(priority, tag, msg, null);
  }

  public void d(String tag, String msg, Throwable tr) {
    logImpl(DEBUG, tag, msg, tr);
  }

  public void d(String tag, String msg) {
    logImpl(DEBUG, tag, msg, null);
  }

  public void e(String tag, String msg, Throwable tr) {
    logImpl(ERROR, tag, msg, tr);
  }

  public void e(String tag, String msg) {
    logImpl(ERROR, tag, msg, null);
  }

  public void i(String tag, String msg, Throwable tr) {
    logImpl(INFO, tag, msg, tr);
  }

  public void i(String tag, String msg) {
    logImpl(INFO, tag, msg, null);
  }

  public void v(String tag, String msg, Throwable tr) {
    logImpl(VERBOSE, tag, msg, tr);
  }

  public void v(String tag, String msg) {
    logImpl(VERBOSE, tag, msg, null);
  }

  public void w(String tag, String msg, Throwable tr) {
    logImpl(WARN, tag, msg, tr);
  }

  public void w(String tag, String msg) {
    logImpl(WARN, tag, msg, null);
  }

  public void wtf(String tag, String msg, Throwable tr) {
    logImpl(WTF, tag, msg, tr);
  }

  public void wtf(String tag, String msg) {
    logImpl(WTF, tag, msg, null);
  }
}
