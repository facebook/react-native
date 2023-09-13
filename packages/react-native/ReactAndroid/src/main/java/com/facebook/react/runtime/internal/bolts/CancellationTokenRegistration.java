/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import java.io.Closeable;

/**
 * Represents a callback delegate that has been registered with a {@link CancellationToken}.
 *
 * @see CancellationToken#register(Runnable)
 */
public class CancellationTokenRegistration implements Closeable {

  private final Object lock = new Object();
  private @Nullable CancellationTokenSource tokenSource;
  private @Nullable Runnable action;
  private boolean closed;

  /* package */ CancellationTokenRegistration(
      @NonNull CancellationTokenSource tokenSource, @NonNull Runnable action) {
    this.tokenSource = tokenSource;
    this.action = action;
  }

  /** Unregisters the callback runnable from the cancellation token. */
  @Override
  public void close() {
    synchronized (lock) {
      if (closed) {
        return;
      }

      closed = true;
      tokenSource.unregister(this);
      tokenSource = null;
      action = null;
    }
  }

  /* package */ void runAction() {
    synchronized (lock) {
      throwIfClosed();
      action.run();
      close();
    }
  }

  private void throwIfClosed() {
    if (closed) {
      throw new IllegalStateException("Object already closed");
    }
  }
}
