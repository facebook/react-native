/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.os.SystemClock
import androidx.annotation.AnyThread
import com.facebook.proguard.annotations.DoNotStrip
import java.util.Queue
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Static class that allows markers to be placed in React code and responded to in a configurable
 * way
 */
@DoNotStrip
public object ReactMarker {
  private val nativeReactMarkerQueue: Queue<ReactMarkerRecord> = ConcurrentLinkedQueue()

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private val listeners: MutableList<MarkerListener> = CopyOnWriteArrayList()

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order. For Fabric-specific events.
  private val fabricMarkerListeners: MutableList<FabricMarkerListener> = CopyOnWriteArrayList()

  @JvmStatic
  @DoNotStrip
  public fun addListener(listener: MarkerListener) {
    if (!listeners.contains(listener)) {
      listeners.add(listener)
    }
  }

  @JvmStatic
  @DoNotStrip
  public fun removeListener(listener: MarkerListener) {
    listeners.remove(listener)
  }

  @JvmStatic @DoNotStrip public fun clearMarkerListeners(): Unit = listeners.clear()

  // Specific to Fabric marker listeners
  @JvmStatic
  @DoNotStrip
  public fun addFabricListener(listener: FabricMarkerListener) {
    if (!fabricMarkerListeners.contains(listener)) {
      fabricMarkerListeners.add(listener)
    }
  }

  // Specific to Fabric marker listeners
  @JvmStatic
  @DoNotStrip
  public fun removeFabricListener(listener: FabricMarkerListener) {
    fabricMarkerListeners.remove(listener)
  }

  // Specific to Fabric marker listeners
  @JvmStatic
  @DoNotStrip
  public fun clearFabricMarkerListeners(): Unit = fabricMarkerListeners.clear()

  // Specific to Fabric marker listeners
  @JvmStatic
  @DoNotStrip
  public fun logFabricMarker(
      name: ReactMarkerConstants,
      tag: String?,
      instanceKey: Int,
      timestamp: Long,
      counter: Int
  ): Unit {
    for (listener in fabricMarkerListeners) {
      listener.logFabricMarker(name, tag, instanceKey, timestamp, counter)
    }
  }

  @JvmStatic
  @DoNotStrip
  public fun logFabricMarker(
      name: ReactMarkerConstants,
      tag: String?,
      instanceKey: Int,
      timestamp: Long
  ) {
    for (listener in fabricMarkerListeners) {
      listener.logFabricMarker(name, tag, instanceKey, timestamp, 0)
    }
  }

  // Specific to Fabric marker listeners
  @JvmStatic
  @DoNotStrip
  public fun logFabricMarker(name: ReactMarkerConstants, tag: String?, instanceKey: Int): Unit =
      logFabricMarker(name, tag, instanceKey, SystemClock.uptimeMillis(), 0)

  @JvmStatic @DoNotStrip public fun logMarker(name: String): Unit = logMarker(name, null)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: String, instanceKey: Int): Unit = logMarker(name, null, instanceKey)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: String, tag: String?): Unit = logMarker(name, tag, 0)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: String, tag: String?, instanceKey: Int): Unit =
      logMarker(ReactMarkerConstants.valueOf(name), tag, instanceKey)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: ReactMarkerConstants): Unit = logMarker(name, null, 0)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: ReactMarkerConstants, instanceKey: Int): Unit =
      logMarker(name, null, instanceKey)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: ReactMarkerConstants, tag: String?): Unit = logMarker(name, tag, 0)

  @JvmStatic
  @DoNotStrip
  public fun logMarker(name: ReactMarkerConstants, time: Long): Unit =
      logMarker(name, null, 0, time)

  @JvmStatic
  @DoNotStrip
  @AnyThread
  public fun logMarker(name: ReactMarkerConstants, tag: String?, instanceKey: Int): Unit =
      logMarker(name, tag, instanceKey, null)

  @JvmStatic
  @DoNotStrip
  @AnyThread
  public fun logMarker(
      name: ReactMarkerConstants,
      tag: String?,
      instanceKey: Int,
      time: Long?
  ): Unit {
    logFabricMarker(name, tag, instanceKey)
    for (listener in listeners) {
      listener.logMarker(name, tag, instanceKey)
    }

    notifyNativeMarker(name, time)
  }

  @JvmStatic
  @DoNotStrip
  private fun notifyNativeMarker(name: ReactMarkerConstants, time: Long?): Unit {
    if (!name.hasMatchingNameMarker) {
      return
    }

    val now = time ?: SystemClock.uptimeMillis()

    if (ReactNativeJniCommonSoLoader.initialized) {
      // First send the current marker
      nativeLogMarker(name.name, now)

      // Then send all cached native ReactMarkers
      while (true) {
        val record = nativeReactMarkerQueue.poll() ?: break
        nativeLogMarker(record.markerName, record.markerTime)
      }
    } else {
      // The native JNI method is not loaded at this point.
      nativeReactMarkerQueue.add(ReactMarkerRecord(name.name, now))
    }
  }

  @JvmStatic @DoNotStrip private external fun nativeLogMarker(markerName: String, markerTime: Long)

  private class ReactMarkerRecord(val markerName: String, val markerTime: Long)

  public fun interface MarkerListener {
    public fun logMarker(name: ReactMarkerConstants, tag: String?, instanceKey: Int)
  }

  // This is for verbose, Fabric-only logging
  // In the future we can deprecate the old logMarker API and
  public interface FabricMarkerListener {
    public fun logFabricMarker(
        name: ReactMarkerConstants,
        tag: String?,
        instanceKey: Int,
        timestamp: Long
    ): Unit

    public fun logFabricMarker(
        name: ReactMarkerConstants,
        tag: String?,
        instanceKey: Int,
        timestamp: Long,
        counter: Int
    ): Unit = logFabricMarker(name, tag, instanceKey, timestamp)
  }
}
