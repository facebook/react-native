/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react;

import android.util.Log;

import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.common.annotations.VisibleForTesting;

import javax.annotation.Nullable;

import static com.facebook.react.bridge.ReactMarkerConstants.RUN_JS_BUNDLE_END;

public class ReactPerformanceLogger implements ReactMarker.MarkerListener {

  public enum Tag {
    BRIDGE_STARTUP,
    SCRIPT_EXECUTION,
  }

  private static final String TAG = ReactPerformanceLogger.class.getSimpleName();

  private long[][] mData = new long[Tag.values().length][2];

  public ReactPerformanceLogger() {
    ReactMarker.addListener(this);
  }

  public long getDuration(Tag tag) {
    return mData[tag.ordinal()][1] - mData[tag.ordinal()][0];
  }

  public void release() {
    ReactMarker.removeListener(this);
  }

  @Override
  public void logMarker(ReactMarkerConstants name, @Nullable String tag, int instanceKey) {
    switch (name) {
      case GET_REACT_INSTANCE_MANAGER_START:
        markStart(Tag.BRIDGE_STARTUP);
        break;

      case RUN_JS_BUNDLE_END:
        markStop(Tag.SCRIPT_EXECUTION);
        break;

      case CHANGE_THREAD_PRIORITY:
        // Due to a bug, RUN_JS_BUNDLE_END may not be triggered:
        // https://github.com/facebook/react-native/issues/23771
        if (getDuration(Tag.SCRIPT_EXECUTION) < 0) {
          logMarker(RUN_JS_BUNDLE_END, tag, instanceKey);
        }
        markStop(Tag.BRIDGE_STARTUP);
        break;

      case PRE_RUN_JS_BUNDLE_START:
        markStart(Tag.SCRIPT_EXECUTION);
        break;

      default:
        break;
    }
  }

  private void markStart(Tag tag) {
    markStart(tag, System.currentTimeMillis());
  }

  private void markStop(Tag tag) {
    markStop(tag, System.currentTimeMillis());
  }

  @VisibleForTesting
  public void markStart(Tag tag, long timestamp) {
    mData[tag.ordinal()][0] = timestamp;
    mData[tag.ordinal()][1] = 0;
  }

  @VisibleForTesting
  public void markStop(Tag tag, long timestamp) {
    if (mData[tag.ordinal()][0] == 0 || mData[tag.ordinal()][1] != 0) {
      Log.i(TAG, "Unbalanced start/end calls for tag " + tag.name());
    } else {
      mData[tag.ordinal()][1] = timestamp;
    }
  }
}
