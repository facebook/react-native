/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric;

import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.ChoreographerCompat;

public abstract class GuardedFrameCallback extends ChoreographerCompat.FrameCallback {

  private final NativeModuleCallExceptionHandler mExceptionHandler;

  @Deprecated
  protected GuardedFrameCallback(ReactContext reactContext) {
    this(reactContext.getExceptionHandler());
  }

  protected GuardedFrameCallback(NativeModuleCallExceptionHandler exceptionHandler) {
    mExceptionHandler = exceptionHandler;
  }

  @Override
  public final void doFrame(long frameTimeNanos) {
    try {
      doFrameGuarded(frameTimeNanos);
    } catch (RuntimeException e) {
      mExceptionHandler.handleException(e);
    }
  }

  /**
   * Like the standard doFrame but RuntimeExceptions will be caught and passed to {@link
   * com.facebook.react.bridge.ReactContext#handleException(RuntimeException)}.
   */
  protected abstract void doFrameGuarded(long frameTimeNanos);
}
