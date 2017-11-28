/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.systrace;

import android.os.Build;
import android.os.Trace;

/**
 * Systrace stub that mostly does nothing but delegates to Trace for beginning/ending sections.
 * The internal version of this file has not been opensourced yet.
 */
public class Systrace {

  public static final long TRACE_TAG_REACT_JAVA_BRIDGE = 0L;
  public static final long TRACE_TAG_REACT_APPS = 0L;
  public static final long TRACE_TAG_REACT_FRESCO = 0L;
  public static final long TRACE_TAG_REACT_VIEW = 0L;
  public static final long TRACE_TAG_REACT_JS_VM_CALLS = 0L;

  public enum EventScope {
    THREAD('t'),
    PROCESS('p'),
    GLOBAL('g');

    private final char mCode;

    private EventScope(char code) {
      mCode = code;
    }

    public char getCode() {
      return mCode;
    }
  }

  public static void registerListener(TraceListener listener) {
  }

  public static void unregisterListener(TraceListener listener) {
  }

  public static boolean isTracing(long tag) {
    return false;
  }

  public static void traceInstant(
      long tag,
      final String title,
      EventScope scope) {
  }

  public static void beginSection(long tag, final String sectionName) {
    if (Build.VERSION.SDK_INT >= 18) {
      Trace.beginSection(sectionName);
    }
  }

  public static void endSection(long tag) {
    if (Build.VERSION.SDK_INT >= 18) {
      Trace.endSection();
    }
  }

  public static void beginAsyncSection(
      long tag,
      final String sectionName,
      final int cookie) {
  }

  public static void beginAsyncSection(
      long tag, final String sectionName, final int cookie, final long startNanos) {}
  
  public static void endAsyncSection(
      long tag,
      final String sectionName,
      final int cookie) {
  }

  public static void endAsyncSection(
      long tag, final String sectionName, final int cookie, final long endNanos) {}
  
  public static void traceCounter(
      long tag,
      final String counterName,
      final int counterValue) {
  }

  public static void startAsyncFlow(
      long tag,
      final String sectionName,
      final int cookie) {
  }

  public static void stepAsyncFlow(
      long tag,
      final String sectionName,
      final int cookie) {
  }

  public static void endAsyncFlow(
      long tag,
      final String sectionName,
      final int cookie) {
  }
}
