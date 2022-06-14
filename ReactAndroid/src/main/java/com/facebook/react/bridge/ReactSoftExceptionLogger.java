/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@DoNotStrip
public class ReactSoftExceptionLogger {
  public interface ReactSoftExceptionListener {
    void logSoftException(final String category, final Throwable cause);
  }

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private static final List<ReactSoftExceptionListener> sListeners = new CopyOnWriteArrayList<>();

  @DoNotStrip
  public static void addListener(ReactSoftExceptionListener listener) {
    if (!sListeners.contains(listener)) {
      sListeners.add(listener);
    }
  }

  @DoNotStrip
  public static void removeListener(ReactSoftExceptionListener listener) {
    sListeners.remove(listener);
  }

  @DoNotStrip
  public static void clearListeners() {
    sListeners.clear();
  }

  @DoNotStrip
  public static void logSoftException(final String category, final Throwable cause) {
    if (sListeners.size() > 0) {
      for (ReactSoftExceptionListener listener : sListeners) {
        listener.logSoftException(category, cause);
      }
    } else {
      FLog.e(category, "Unhandled SoftException", cause);
    }
  }

  @DoNotStrip
  // For use from within the C++ JReactSoftExceptionLogger
  private static void logNoThrowSoftExceptionWithMessage(
      final String category, final String message) {
    logSoftException(category, new ReactNoCrashSoftException(message));
  }
}
