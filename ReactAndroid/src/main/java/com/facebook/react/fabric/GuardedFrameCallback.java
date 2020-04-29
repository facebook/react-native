/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

<<<<<<< HEAD
=======
import androidx.annotation.NonNull;
>>>>>>> fb/0.62-stable
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.ChoreographerCompat;

public abstract class GuardedFrameCallback extends ChoreographerCompat.FrameCallback {

<<<<<<< HEAD
  private final NativeModuleCallExceptionHandler mExceptionHandler;

  @Deprecated
  protected GuardedFrameCallback(ReactContext reactContext) {
    this(reactContext.getExceptionHandler());
  }

  protected GuardedFrameCallback(NativeModuleCallExceptionHandler exceptionHandler) {
=======
  @NonNull private final NativeModuleCallExceptionHandler mExceptionHandler;

  @Deprecated
  protected GuardedFrameCallback(@NonNull ReactContext reactContext) {
    this(reactContext.getExceptionHandler());
  }

  protected GuardedFrameCallback(@NonNull NativeModuleCallExceptionHandler exceptionHandler) {
>>>>>>> fb/0.62-stable
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
