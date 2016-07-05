/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import javax.annotation.Nullable;

import android.os.Handler;
import android.os.Looper;

/**
 * Utility for interacting with the UI thread.
 */
public class UiThreadUtil {

  @Nullable private static Handler sMainHandler;

  /**
   * @return {@code true} if the current thread is the UI thread.
   */
  public static boolean isOnUiThread() {
    return Looper.getMainLooper().getThread() == Thread.currentThread();
  }

  /**
   * Throws an {@link AssertionException} if the current thread is not the UI thread.
   */
  public static void assertOnUiThread() {
    SoftAssertions.assertCondition(isOnUiThread(), "Expected to run on UI thread!");
  }

  /**
   * Throws an {@link AssertionException} if the current thread is the UI thread.
   */
  public static void assertNotOnUiThread() {
    SoftAssertions.assertCondition(!isOnUiThread(), "Expected not to run on UI thread!");
  }

  /**
   * Runs the given {@code Runnable} on the UI thread.
   */
  public static void runOnUiThread(Runnable runnable) {
    synchronized (UiThreadUtil.class) {
      if (sMainHandler == null) {
        sMainHandler = new Handler(Looper.getMainLooper());
      }
    }
    sMainHandler.post(runnable);
  }
}
