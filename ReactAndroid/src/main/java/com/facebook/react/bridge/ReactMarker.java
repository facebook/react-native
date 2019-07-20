// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.ArrayList;
import java.util.List;

/**
 * Static class that allows markers to be placed in React code and responded to in a configurable
 * way
 */
@DoNotStrip
public class ReactMarker {

  public interface MarkerListener {
    void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey);
  };

  // This is for verbose, Fabric-only logging
  // In the future we can deprecate the old logMarker API and
  public interface FabricMarkerListener {
    void logFabricMarker(
        ReactMarkerConstants name, @Nullable String tag, int instanceKey, long timestamp);
  };

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private static final List<MarkerListener> sListeners = new ArrayList<>();

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order. For Fabric-specific events.
  private static final List<FabricMarkerListener> sFabricMarkerListeners = new ArrayList<>();

  @DoNotStrip
  public static void addListener(MarkerListener listener) {
    synchronized (sListeners) {
      if (!sListeners.contains(listener)) {
        sListeners.add(listener);
      }
    }
  }

  @DoNotStrip
  public static void removeListener(MarkerListener listener) {
    synchronized (sListeners) {
      sListeners.remove(listener);
    }
  }

  @DoNotStrip
  public static void clearMarkerListeners() {
    synchronized (sListeners) {
      sListeners.clear();
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void addFabricListener(FabricMarkerListener listener) {
    synchronized (sFabricMarkerListeners) {
      if (!sFabricMarkerListeners.contains(listener)) {
        sFabricMarkerListeners.add(listener);
      }
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void removeFabricListener(FabricMarkerListener listener) {
    synchronized (sFabricMarkerListeners) {
      sFabricMarkerListeners.remove(listener);
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void clearFabricMarkerListeners() {
    synchronized (sFabricMarkerListeners) {
      sFabricMarkerListeners.clear();
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void logFabricMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey, long timestamp) {
    synchronized (sFabricMarkerListeners) {
      for (FabricMarkerListener listener : sFabricMarkerListeners) {
        listener.logFabricMarker(name, tag, instanceKey, timestamp);
      }
    }
  }

  // Specific to Fabric marker listeners
  @DoNotStrip
  public static void logFabricMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
    logFabricMarker(name, tag, instanceKey, -1);
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
  public static void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
    synchronized (sListeners) {
      for (MarkerListener listener : sListeners) {
        listener.logMarker(name, tag, instanceKey);
      }
    }
    logFabricMarker(name, tag, instanceKey);
  }
}
