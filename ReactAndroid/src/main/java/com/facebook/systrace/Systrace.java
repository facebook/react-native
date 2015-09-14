/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.systrace;


/**
 * Systrace stub.
 */
public class Systrace {

  public static final long TRACE_TAG_REACT_JAVA_BRIDGE = 0L;

  public static void beginSection(long tag, final String sectionName) {
  }

  public static void endSection(long tag) {
  }

  public static void traceCounter(
      long tag,
      final String counterName,
      final int counterValue) {
  }
}
