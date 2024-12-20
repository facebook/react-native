/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import com.facebook.react.bridge.MemoryPressureListener
import java.util.concurrent.CopyOnWriteArrayList

/** Translates and routes memory pressure events. */
public class MemoryPressureRouter(context: Context) : ComponentCallbacks2 {

  private val listeners: CopyOnWriteArrayList<MemoryPressureListener> =
      CopyOnWriteArrayList<MemoryPressureListener>()

  init {
    context.applicationContext.registerComponentCallbacks(this)
  }

  public fun destroy(context: Context): Unit {
    context.applicationContext.unregisterComponentCallbacks(this)
  }

  /** Add a listener to be notified of memory pressure events. */
  public fun addMemoryPressureListener(listener: MemoryPressureListener?): Unit {
    if (!listeners.contains(listener)) {
      listeners.add(listener)
    }
  }

  /** Remove a listener previously added with [addMemoryPressureListener]. */
  public fun removeMemoryPressureListener(listener: MemoryPressureListener?): Unit {
    listeners.remove(listener)
  }

  override fun onTrimMemory(level: Int): Unit {
    dispatchMemoryPressure(level)
  }

  override fun onConfigurationChanged(newConfig: Configuration): Unit = Unit

  @Deprecated("onLowMemory is deprecated") override fun onLowMemory(): Unit = Unit

  private fun dispatchMemoryPressure(level: Int) {
    for (listener in listeners) {
      listener.handleMemoryPressure(level)
    }
  }
}
