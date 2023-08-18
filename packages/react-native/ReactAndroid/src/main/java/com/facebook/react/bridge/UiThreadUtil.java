/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.os.Handler;
import android.os.Looper;
import androidx.annotation.Nullable;
import com.facebook.react.common.build.ReactBuildConfig;

/** Utility for interacting with the UI thread. */
public class UiThreadUtil {

  @Nullable private static Handler sMainHandler;

  /** @return {@code true} if the current thread is the UI thread. */
  public static boolean isOnUiThread() {
    return Looper.getMainLooper().getThread() == Thread.currentThread();
  }

  /**
   * Throws an {@link AssertionException} if the current thread is not the UI thread. This is a noop
   * in production, and is only meant to run in debug mode! If you need to check for
   * incorrect-thread issues in production, duplicate this code and call it elsewhere.
   */
  public static void assertOnUiThread() {
    if (ReactBuildConfig.DEBUG) {
      SoftAssertions.assertCondition(isOnUiThread(), "Expected to run on UI thread!");
    }
  }

  /**
   * Throws an {@link AssertionException} if the current thread is the UI thread. This is a noop in
   * production, and is only meant to run in debug mode! If you need to check for incorrect-thread
   * issues in production, duplicate this code and call it elsewhere.
   */
  public static void assertNotOnUiThread() {
    if (ReactBuildConfig.DEBUG) {
      SoftAssertions.assertCondition(!isOnUiThread(), "Expected not to run on UI thread!");
    }
  }

  /** Runs the given {@code Runnable} on the UI thread. */
  public static void runOnUiThread(Runnable runnable) {
    runOnUiThread(runnable, 0);
  }

  /** Runs the given {@code Runnable} on the UI thread with the specified delay. */
  public static void runOnUiThread(Runnable runnable, long delayInMs) {
    synchronized (UiThreadUtil.class) {
      if (sMainHandler == null) {
        sMainHandler = new Handler(Looper.getMainLooper());
      }
    }
    sMainHandler.postDelayed(runnable, delayInMs);
  }
}
