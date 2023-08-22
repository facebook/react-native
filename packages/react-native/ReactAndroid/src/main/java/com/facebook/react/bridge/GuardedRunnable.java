/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Abstract base for a Runnable that should have any RuntimeExceptions it throws handled by the
 * {@link JSExceptionHandler} registered if the app is in dev mode.
 */
public abstract class GuardedRunnable implements Runnable {

  private final JSExceptionHandler mExceptionHandler;

  public GuardedRunnable(ReactContext reactContext) {
    this(reactContext.getExceptionHandler());
  }

  public GuardedRunnable(JSExceptionHandler exceptionHandler) {
    mExceptionHandler = exceptionHandler;
  }

  @Override
  public final void run() {
    try {
      runGuarded();
    } catch (RuntimeException e) {
      mExceptionHandler.handleException(e);
    }
  }

  public abstract void runGuarded();
}
