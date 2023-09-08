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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Signals to a {@link CancellationToken} that it should be canceled. To create a {@code
 * CancellationToken} first create a {@code CancellationTokenSource} then call {@link #getToken()}
 * to retrieve the token for the source.
 *
 * @see CancellationToken
 * @see CancellationTokenSource#getToken()
 */
public class CancellationTokenSource implements Closeable {

  private final Object lock = new Object();
  private final @NonNull List<CancellationTokenRegistration> registrations = new ArrayList<>();
  private final @NonNull ScheduledExecutorService executor = BoltsExecutors.scheduled();
  @Nullable private ScheduledFuture<?> scheduledCancellation;
  private boolean cancellationRequested;
  private boolean closed;

  /** Create a new {@code CancellationTokenSource}. */
  public CancellationTokenSource() {}

  /**
   * @return {@code true} if cancellation has been requested for this {@code
   *     CancellationTokenSource}.
   */
  public boolean isCancellationRequested() {
    synchronized (lock) {
      throwIfClosed();
      return cancellationRequested;
    }
  }

  /** @return the token that can be passed to asynchronous method to control cancellation. */
  public @NonNull CancellationToken getToken() {
    synchronized (lock) {
      throwIfClosed();
      return new CancellationToken(this);
    }
  }

  /** Cancels the token if it has not already been cancelled. */
  public void cancel() {
    List<CancellationTokenRegistration> registrations;
    synchronized (lock) {
      throwIfClosed();
      if (cancellationRequested) {
        return;
      }

      cancelScheduledCancellation();

      cancellationRequested = true;
      registrations = new ArrayList<>(this.registrations);
    }
    notifyListeners(registrations);
  }

  /**
   * Schedules a cancel operation on this {@code CancellationTokenSource} after the specified number
   * of milliseconds.
   *
   * @param delay The number of milliseconds to wait before completing the returned task. If delay
   *     is {@code 0} the cancel is executed immediately. If delay is {@code -1} any scheduled
   *     cancellation is stopped.
   */
  public void cancelAfter(final long delay) {
    cancelAfter(delay, TimeUnit.MILLISECONDS);
  }

  private void cancelAfter(long delay, @NonNull TimeUnit timeUnit) {
    if (delay < -1) {
      throw new IllegalArgumentException("Delay must be >= -1");
    }

    if (delay == 0) {
      cancel();
      return;
    }

    synchronized (lock) {
      if (cancellationRequested) {
        return;
      }

      cancelScheduledCancellation();

      if (delay != -1) {
        scheduledCancellation =
            executor.schedule(
                new Runnable() {
                  @Override
                  public void run() {
                    synchronized (lock) {
                      scheduledCancellation = null;
                    }
                    cancel();
                  }
                },
                delay,
                timeUnit);
      }
    }
  }

  @Override
  public void close() {
    synchronized (lock) {
      if (closed) {
        return;
      }

      cancelScheduledCancellation();

      List<CancellationTokenRegistration> registrations = new ArrayList<>(this.registrations);
      for (CancellationTokenRegistration registration : registrations) {
        registration.close();
      }
      this.registrations.clear();
      closed = true;
    }
  }

  /* package */ @NonNull
  CancellationTokenRegistration register(@NonNull Runnable action) {
    CancellationTokenRegistration ctr;
    synchronized (lock) {
      throwIfClosed();

      ctr = new CancellationTokenRegistration(this, action);
      if (cancellationRequested) {
        ctr.runAction();
      } else {
        registrations.add(ctr);
      }
    }
    return ctr;
  }

  /**
   * @throws CancellationException if this token has had cancellation requested. May be used to stop
   *     execution of a thread or runnable.
   */
  /* package */ void throwIfCancellationRequested() throws CancellationException {
    synchronized (lock) {
      throwIfClosed();
      if (cancellationRequested) {
        throw new CancellationException();
      }
    }
  }

  /* package */ void unregister(@NonNull CancellationTokenRegistration registration) {
    synchronized (lock) {
      throwIfClosed();
      registrations.remove(registration);
    }
  }

  // This method makes no attempt to perform any synchronization or state checks itself and once
  // invoked will notify all runnables unconditionally. As such if you require the notification
  // event
  // to be synchronized with state changes you should provide external synchronization.
  // If this is invoked without external synchronization there is a probability the token becomes
  // cancelled concurrently.
  private void notifyListeners(@NonNull List<CancellationTokenRegistration> registrations) {
    for (CancellationTokenRegistration registration : registrations) {
      registration.runAction();
    }
  }

  @Override
  public String toString() {
    return String.format(
        Locale.US,
        "%s@%s[cancellationRequested=%s]",
        getClass().getName(),
        Integer.toHexString(hashCode()),
        Boolean.toString(isCancellationRequested()));
  }

  // This method makes no attempt to perform any synchronization itself - you should ensure
  // accesses to this method are synchronized if you want to ensure correct behaviour in the
  // face of a concurrent invocation of the close method.
  private void throwIfClosed() {
    if (closed) {
      throw new IllegalStateException("Object already closed");
    }
  }

  // Performs no synchronization.
  private void cancelScheduledCancellation() {
    if (scheduledCancellation != null) {
      scheduledCancellation.cancel(true);
      scheduledCancellation = null;
    }
  }
}
