// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

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

  private static @Nullable MarkerListener sMarkerListener = null;

  public static void initialize(MarkerListener listener) {
    if (sMarkerListener == null) {
      sMarkerListener = listener;
    }
  }

  @DoNotStrip
  public static void clearMarkerListener() {
    sMarkerListener = null;
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
    if (sMarkerListener != null) {
      sMarkerListener.logMarker(ReactMarkerConstants.valueOf(name), tag, instanceKey);
    }
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
    logMarker(name, null, 0);
  }

  @DoNotStrip
  public static void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
    if (sMarkerListener != null) {
      sMarkerListener.logMarker(name, tag, instanceKey);
    }
  }
}
