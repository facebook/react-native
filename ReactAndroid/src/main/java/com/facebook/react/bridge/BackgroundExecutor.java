/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@DoNotStrip
public class BackgroundExecutor {
  private static final String TAG = "FabricBackgroundExecutor";
  private final ExecutorService mExecutorService;

  @DoNotStrip
  private BackgroundExecutor() {
    mExecutorService = Executors.newFixedThreadPool(1);
  }

  @DoNotStrip
  private void queueRunnable(Runnable runnable) {
    // Very rarely, an NPE is hit here - probably has to do with deallocation
    // race conditions and the JNI.
    // It's not clear yet which of these is most prevalent, or if either is a concern.
    // If we don't find these logs in production then we can probably safely remove the logging,
    // but it's also cheap to leave it here.

    if (runnable == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG, new ReactNoCrashSoftException("runnable is null"));
      return;
    }

    final ExecutorService executorService = mExecutorService;
    if (executorService == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG, new ReactNoCrashSoftException("executorService is null"));
      return;
    }

    executorService.execute(runnable);
  }
}
