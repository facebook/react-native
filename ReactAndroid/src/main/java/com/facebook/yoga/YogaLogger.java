/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import androidx.annotation.Keep;

/**
 * Interface for receiving logs from native layer. Use by setting YogaNode.setLogger(myLogger);
 * See YogaLogLevel for the different log levels.
 */
@Keep
public interface YogaLogger {
  @Keep
  void log(YogaLogLevel level, String message);
}
