/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Abstract base for a Runnable that should have any RuntimeExceptions it throws handled by the
 * [JSExceptionHandler] registered if the app is in dev mode.
 */
public abstract class GuardedRunnable(private val exceptionHandler: JSExceptionHandler) : Runnable {
  public constructor(reactContext: ReactContext) : this(reactContext.exceptionHandler)

  final override fun run() {
    try {
      runGuarded()
    } catch (e: RuntimeException) {
      exceptionHandler.handleException(e)
    }
  }

  public abstract fun runGuarded()
}
