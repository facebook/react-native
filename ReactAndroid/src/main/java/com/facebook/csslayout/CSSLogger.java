/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Inteface for recieving logs from native layer. Use by setting CSSNode.setLogger(myLogger);
 * LOG_LEVEL_ERROR indicated a fatal error.
 */
public interface CSSLogger {
  public final int LOG_LEVEL_ERROR = 0;
  public final int LOG_LEVEL_WARN = 1;
  public final int LOG_LEVEL_INFO = 2;
  public final int LOG_LEVEL_DEBUG = 3;
  public final int LOG_LEVEL_VERBOSE = 4;

  @DoNotStrip
  void log(int level, String message);
}
