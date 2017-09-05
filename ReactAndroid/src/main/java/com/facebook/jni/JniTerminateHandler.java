// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.jni;

public class JniTerminateHandler {
  public static void handleTerminate(Throwable t) throws Throwable {
    Thread.UncaughtExceptionHandler h = Thread.getDefaultUncaughtExceptionHandler();
    if (h == null) {
      // Odd. Let the default std::terminate_handler deal with it.
      return;
    }
    h.uncaughtException(Thread.currentThread(), t);
    // That should exit. If it doesn't, let the default handler deal with it.
  }
}
