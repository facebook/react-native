/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util

import com.facebook.react.bridge.JavaScriptModule

/**
 * JS module interface for RCTLog
 *
 * The RCTLog module allows for showing native logs in JavaScript.
 */
internal interface RCTLog : JavaScriptModule {
  /**
   * Send a log to JavaScript.
   *
   * @param level The level of the log.
   * @param message The message to log.
   */
  fun logIfNoNativeHook(level: String?, message: String?)
}
