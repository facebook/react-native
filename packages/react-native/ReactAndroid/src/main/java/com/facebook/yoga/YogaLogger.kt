/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

import com.facebook.yoga.annotations.DoNotStrip

/**
 * Interface for receiving logs from native layer. Use by setting YogaNode.setLogger(myLogger); See
 * YogaLogLevel for the different log levels.
 */
@DoNotStrip
public fun interface YogaLogger {
  @DoNotStrip public fun log(level: YogaLogLevel, message: String)
}
