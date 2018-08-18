// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import java.util.List;
import java.util.ArrayList;

import javax.annotation.Nullable;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Static class that allows markers to be placed in React code and responded to in a
 * configurable way
 */
@DoNotStrip
public class ReactMarker {

  public interface MarkerListener {
    void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey);
  };

  // Use a list instead of a set here because we expect the number of listeners
  // to be very small, and we want listeners to be called in a deterministic
  // order.
  private static final List<MarkerListener> sListeners = new ArrayList<>();

  @DoNotStrip
  public static void addListener(MarkerListener listener) {
    synchronized(sListeners) {
      if (!sListeners.contains(listener)) {
        sListeners.add(listener);
      }
    }
  }

  @DoNotStrip
  public static void removeListener(MarkerListener listener) {
    synchronized(sListeners) {
      sListeners.remove(listener);
    }
  }

  @DoNotStrip
  public static void clearMarkerListeners() {
    synchronized(sListeners) {
      sListeners.clear();
    }
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
    synchronized(sListeners) {
      for (MarkerListener listener : sListeners) {
        listener.logMarker(name, tag, instanceKey);
      }
    }
  }
}
