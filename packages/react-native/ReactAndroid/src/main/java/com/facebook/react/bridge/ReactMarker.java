/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.os.SystemClock;
import androidx.annotation.AnyThread;
import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Static class that allows markers to be placed in React code and responded to in a configurable
 * way
 */
@DoNotStrip
public class ReactMarker {

  private static Queue<ReactMarkerRecord> sNativeReactMarkerQueue = new ConcurrentLinkedQueue<>();

  private static class ReactMarkerRecord {
    private final String mMarkerName;
    private final long mMarkerTime;

    public ReactMarkerRecord(String markerName, long markerTime) {
      mMarkerName = markerName;
      mMarkerTime = markerTime;
    }

    public String getMarkerName() {
      return mMarkerName;
    }

    public long getMarkerTime() {
      return mMarkerTime;
    }
  }

  public interface MarkerListener {
    void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey);
  };

  // This is for verbose, Fabric-only logging
  // In the future we can deprecate the old logMarker API and
  public interface FabricMarkerListener {
    void logFabricMarker(
        ReactMarkerConstants name, @Nullable String tag, int instanceKey, long timestamp);

    default void logFabricMarker(
        ReactMarkerConstants name,
        @Nullable String tag,
        int instanceKey,
        long timestamp,
        int counter) {
      logFabricMarker(name, tag, instanceKey, timestamp);
    }
  };

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private static final List<MarkerListener> sListeners = new CopyOnWriteArrayList<>();

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order. For Fabric-specific events.
  private static final List<FabricMarkerListener> sFabricMarkerListeners =
      new CopyOnWriteArrayList<>();

  @DoNotStrip
  public static void addListener(MarkerListener listener) {
    if (!sListeners.contains(listener)) {
      sListeners.add(listener);
    }
  }

  @DoNotStrip
  public static void removeListener(MarkerListener listener) {
    sListeners.remove(listener);
  }

  @DoNotStrip
  public static void clearMarkerListeners() {
    sListeners.clear();
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void addFabricListener(FabricMarkerListener listener) {
    if (!sFabricMarkerListeners.contains(listener)) {
      sFabricMarkerListeners.add(listener);
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void removeFabricListener(FabricMarkerListener listener) {
    sFabricMarkerListeners.remove(listener);
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void clearFabricMarkerListeners() {
    sFabricMarkerListeners.clear();
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void logFabricMarker(
      ReactMarkerConstants name,
      @Nullable String tag,
      int instanceKey,
      long timestamp,
      int counter) {
    for (FabricMarkerListener listener : sFabricMarkerListeners) {
      listener.logFabricMarker(name, tag, instanceKey, timestamp, counter);
    }
  }

  @DoNotStrip
  public static void logFabricMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey, long timestamp) {
    for (FabricMarkerListener listener : sFabricMarkerListeners) {
      listener.logFabricMarker(name, tag, instanceKey, timestamp, 0);
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void logFabricMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
    logFabricMarker(name, tag, instanceKey, SystemClock.uptimeMillis(), 0);
  }

  @DoNotStrip
  public static void logMarker(String name) {
    logMarker(name, null);
  }

  @DoNotStrip
  public static void logMarker(String name, int instanceKey) {
    logMarker(name, null, instanceKey);
  }

  @DoNotStrip
  public static void logMarker(String name, @Nullable String tag) {
    logMarker(name, tag, 0);
  }

  @DoNotStrip
  public static void logMarker(String name, @Nullable String tag, int instanceKey) {
    ReactMarkerConstants marker = ReactMarkerConstants.valueOf(name);
    logMarker(marker, tag, instanceKey);
  }

  @DoNotStrip
  public static void logMarker(ReactMarkerConstants name) {
    logMarker(name, null, 0);
  }

  @DoNotStrip
  public static void logMarker(ReactMarkerConstants name, int instanceKey) {
    logMarker(name, null, instanceKey);
  }

  @DoNotStrip
  public static void logMarker(ReactMarkerConstants name, @Nullable String tag) {
    logMarker(name, tag, 0);
  }

  @DoNotStrip
  public static void logMarker(ReactMarkerConstants name, long time) {
    logMarker(name, null, 0, time);
  }

  @DoNotStrip
  @AnyThread
  public static void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
    logMarker(name, tag, instanceKey, null);
  }

  @DoNotStrip
  @AnyThread
  public static void logMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey, @Nullable Long time) {
    logFabricMarker(name, tag, instanceKey);
    for (MarkerListener listener : sListeners) {
      listener.logMarker(name, tag, instanceKey);
    }

    notifyNativeMarker(name, time);
  }

  @DoNotStrip
  private static void notifyNativeMarker(ReactMarkerConstants name, @Nullable Long time) {
    if (!name.hasMatchingNameMarker()) {
      return;
    }

    @Nullable Long now = time;
    if (now == null) {
      now = SystemClock.uptimeMillis();
    }

    if (ReactBridge.isInitialized()) {
      // First send the current marker
      nativeLogMarker(name.name(), now);

      // Then send all cached native ReactMarkers
      ReactMarkerRecord record;
      while ((record = sNativeReactMarkerQueue.poll()) != null) {
        nativeLogMarker(record.getMarkerName(), record.getMarkerTime());
      }
    } else {
      // The native JNI method is not loaded at this point.
      sNativeReactMarkerQueue.add(new ReactMarkerRecord(name.name(), now));
    }
  }

  @DoNotStrip
  private static native void nativeLogMarker(String markerName, long markerTime);
}
