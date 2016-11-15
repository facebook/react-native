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
 * See CSSLogLevel for the different log levels.
 */
public interface CSSLogger {
  @DoNotStrip
  void log(CSSLogLevel level, String message);
}
