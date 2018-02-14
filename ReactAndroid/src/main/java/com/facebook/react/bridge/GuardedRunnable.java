// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

/**
 * Abstract base for a Runnable that should have any RuntimeExceptions it throws
 * handled by the {@link com.facebook.react.bridge.NativeModuleCallExceptionHandler} registered if
 * the app is in dev mode.
 */
public abstract class GuardedRunnable implements Runnable {

  private final ReactContext mReactContext;

  public GuardedRunnable(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public final void run() {
    try {
      runGuarded();
    } catch (RuntimeException e) {
      mReactContext.handleException(e);
    }
  }

  public abstract void runGuarded();
}
