/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static com.facebook.infer.annotation.Assertions.assertNotNull;

import android.annotation.SuppressLint;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import java.util.Objects;

@Nullsafe(Nullsafe.Mode.LOCAL)
class BridgelessAtomicRef<T> {

  interface Provider<T> {
    T get();
  }

  @Nullable volatile T mValue;
  @Nullable T mInitialValue;

  enum State {
    Init,
    Creating,
    Success,
    Failure
  }

  private volatile State state;
  private volatile String failureMessage;

  public BridgelessAtomicRef(@Nullable T initialValue) {
    mValue = initialValue;
    mInitialValue = initialValue;
    state = State.Init;
    failureMessage = "";
  }

  public BridgelessAtomicRef() {
    this(null);
  }

  @SuppressLint("CatchGeneralException")
  public T getOrCreate(BridgelessAtomicRef.Provider<T> provider) {
    boolean shouldCreate = false;
    synchronized (this) {
      if (state == State.Success) {
        return get();
      }

      if (state == State.Failure) {
        throw new RuntimeException(
            "BridgelessAtomicRef: Failed to create object. Reason: " + failureMessage);
      }

      if (state != State.Creating) {
        state = State.Creating;
        shouldCreate = true;
      }
    }

    if (shouldCreate) {
      try {
        // Call provider with lock on `this` released to mitigate deadlock hazard
        mValue = provider.get();

        synchronized (this) {
          state = State.Success;
          notifyAll();
          return get();
        }
      } catch (RuntimeException ex) {
        synchronized (this) {
          state = State.Failure;
          String message = ex.getMessage();
          failureMessage = Objects.toString(message, "null");
          notifyAll();
        }

        throw new RuntimeException("BridgelessAtomicRef: Failed to create object.", ex);
      }
    }

    synchronized (this) {
      boolean wasInterrupted = false;
      while (state == State.Creating) {
        try {
          wait();
        } catch (InterruptedException ex) {
          wasInterrupted = true;
        }
      }

      if (wasInterrupted) {
        Thread.currentThread().interrupt();
      }

      if (state == State.Failure) {
        throw new RuntimeException(
            "BridgelessAtomicRef: Failed to create object. Reason: " + failureMessage);
      }

      return get();
    }
  }

  public synchronized T getAndReset() {
    T value = get();
    reset();
    return value;
  }

  public synchronized void reset() {
    mValue = mInitialValue;
    state = State.Init;
    failureMessage = "";
  }

  public synchronized T get() {
    return assertNotNull(mValue);
  }

  public synchronized @Nullable T getNullable() {
    return mValue;
  }
}
