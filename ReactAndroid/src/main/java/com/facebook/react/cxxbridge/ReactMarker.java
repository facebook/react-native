// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.cxxbridge;

import javax.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
/**
 * Static class that allows markers to be placed in React code and responded to in a
 * configurable way
 */
@DoNotStrip
public class ReactMarker {

  public interface MarkerListener {
    void logMarker(String name);
  };

  @Nullable static private MarkerListener sMarkerListener = null;

  static public void setMarkerListener(MarkerListener listener) {
    sMarkerListener = listener;
  }

  @DoNotStrip
  static public void logMarker(String name) {
    if (sMarkerListener != null) {
      sMarkerListener.logMarker(name);
    }
  }

}
