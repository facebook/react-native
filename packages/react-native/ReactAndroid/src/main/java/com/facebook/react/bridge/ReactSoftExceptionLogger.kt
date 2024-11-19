/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.common.logging.FLog
import com.facebook.proguard.annotations.DoNotStrip
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.jvm.JvmStatic

@DoNotStrip
public object ReactSoftExceptionLogger {

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private val listeners: MutableList<ReactSoftExceptionListener> = CopyOnWriteArrayList()

  @JvmStatic
  public fun addListener(listener: ReactSoftExceptionListener): Unit {
    if (!listeners.contains(listener)) {
      listeners.add(listener)
    }
  }

  @JvmStatic
  public fun removeListener(listener: ReactSoftExceptionListener): Unit {
    listeners.remove(listener)
  }

  @JvmStatic
  public fun clearListeners(): Unit {
    listeners.clear()
  }

  @JvmStatic
  public fun logSoftExceptionVerbose(category: String, cause: Throwable): Unit {
    logSoftException("${category}|${cause.javaClass.simpleName}:${cause.message}", cause)
  }

  @JvmStatic
  public fun logSoftException(category: String, cause: Throwable): Unit {
    if (!listeners.isEmpty()) {
      for (listener in listeners) {
        listener.logSoftException(category, cause)
      }
    } else {
      FLog.e(category, "Unhandled SoftException", cause)
    }
  }

  @JvmStatic
  @DoNotStrip
  private fun logNoThrowSoftExceptionWithMessage(category: String, message: String) {
    logSoftException(category, ReactNoCrashSoftException(message))
  }

  public fun interface ReactSoftExceptionListener {
    public fun logSoftException(category: String, cause: Throwable)
  }
}
