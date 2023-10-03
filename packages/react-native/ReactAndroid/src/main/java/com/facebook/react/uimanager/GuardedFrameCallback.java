/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.Choreographer;
import com.facebook.react.bridge.JSExceptionHandler;
import com.facebook.react.bridge.ReactContext;

/**
 * Abstract base for a Choreographer FrameCallback that should have any RuntimeExceptions it throws
 * handled by the {@link JSExceptionHandler} registered if the app is in dev mode.
 */
public abstract class GuardedFrameCallback implements Choreographer.FrameCallback {

  private final ReactContext mReactContext;

  protected GuardedFrameCallback(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public final void doFrame(long frameTimeNanos) {
    try {
      doFrameGuarded(frameTimeNanos);
    } catch (RuntimeException e) {
      mReactContext.handleException(e);
    }
  }

  /**
   * Like the standard doFrame but RuntimeExceptions will be caught and passed to {@link
   * com.facebook.react.bridge.ReactContext#handleException(RuntimeException)}.
   */
  protected abstract void doFrameGuarded(long frameTimeNanos);
}
