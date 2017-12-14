/*
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Interface for receiving logs from native layer. Use by setting YogaNode.setLogger(myLogger);
 * See YogaLogLevel for the different log levels.
 */
@DoNotStrip
public interface YogaLogger {
  @DoNotStrip
  void log(YogaNode node, YogaLogLevel level, String message);
}
