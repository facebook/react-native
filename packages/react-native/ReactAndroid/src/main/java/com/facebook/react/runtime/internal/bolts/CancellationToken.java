/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.NonNull;
import java.util.Locale;
import java.util.concurrent.CancellationException;

/**
 * Propagates notification that operations should be canceled.
 *
 * <p>Create an instance of {@code CancellationTokenSource} and pass the token returned from {@code
 * CancellationTokenSource#getToken()} to the asynchronous operation(s). Call {@code
 * CancellationTokenSource#cancel()} to cancel the operations.
 *
 * <p>A {@code CancellationToken} can only be cancelled once - it should not be passed to future
 * operations once cancelled.
 *
 * @see CancellationTokenSource
 * @see CancellationTokenSource#getToken()
 * @see CancellationTokenSource#cancel()
 * @see CancellationToken#register(Runnable)
 */
public class CancellationToken {

  private final CancellationTokenSource tokenSource;

  /* package */ CancellationToken(@NonNull CancellationTokenSource tokenSource) {
    this.tokenSource = tokenSource;
  }

  /**
   * @return {@code true} if the cancellation was requested from the source, {@code false}
   *     otherwise.
   */
  public boolean isCancellationRequested() {
    return tokenSource.isCancellationRequested();
  }

  /**
   * Registers a runnable that will be called when this CancellationToken is canceled. If this token
   * is already in the canceled state, the runnable will be run immediately and synchronously.
   *
   * @param action the runnable to be run when the token is cancelled.
   * @return a {@link CancellationTokenRegistration} instance that can be used to unregister the
   *     action.
   */
  public @NonNull CancellationTokenRegistration register(@NonNull Runnable action) {
    return tokenSource.register(action);
  }

  /**
   * @throws CancellationException if this token has had cancellation requested. May be used to stop
   *     execution of a thread or runnable.
   */
  public void throwIfCancellationRequested() throws CancellationException {
    tokenSource.throwIfCancellationRequested();
  }

  @Override
  public String toString() {
    return String.format(
        Locale.US,
        "%s@%s[cancellationRequested=%s]",
        getClass().getName(),
        Integer.toHexString(hashCode()),
        Boolean.toString(tokenSource.isCancellationRequested()));
  }
}
