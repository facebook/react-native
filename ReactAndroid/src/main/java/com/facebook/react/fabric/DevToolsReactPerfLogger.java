/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.react.bridge.ReactMarkerConstants.*;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DevToolsReactPerfLogger implements ReactMarker.FabricMarkerListener {

  private final Map<Integer, FabricCommitPoint> mFabricCommitMarkers = new HashMap<>();
  private final List<DevToolsReactPerfLoggerListener> mDevToolsReactPerfLoggerListeners =
      new ArrayList<>();

  public interface DevToolsReactPerfLoggerListener {

    void onFabricCommitEnd(FabricCommitPoint commitPoint);
  }

  public static class FabricCommitPoint {
    private final long mCommitNumber;
    private final Map<ReactMarkerConstants, Long> mPoints = new HashMap<>();

    private FabricCommitPoint(int commitNumber) {
      this.mCommitNumber = commitNumber;
    }

    private void addPoint(ReactMarkerConstants key, long time) {
      mPoints.put(key, time);
    }

    private long getValue(ReactMarkerConstants marker) {
      Long value = mPoints.get(marker);
      return value != null ? value : -1;
    }

    public long getCommitNumber() {
      return mCommitNumber;
    }

    public long getCommitStart() {
      return getValue(FABRIC_COMMIT_START);
    }

    public long getCommitEnd() {
      return getValue(FABRIC_COMMIT_END);
    }

    public long getFinishTransactionStart() {
      return getValue(FABRIC_FINISH_TRANSACTION_START);
    }

    public long getFinishTransactionEnd() {
      return getValue(FABRIC_FINISH_TRANSACTION_END);
    }

    public long getDiffStart() {
      return getValue(FABRIC_DIFF_START);
    }

    public long getDiffEnd() {
      return getValue(FABRIC_DIFF_END);
    }

    public long getLayoutStart() {
      return getValue(FABRIC_LAYOUT_START);
    }

    public long getLayoutEnd() {
      return getValue(FABRIC_LAYOUT_END);
    }

    public long getBatchExecutionStart() {
      return getValue(FABRIC_BATCH_EXECUTION_START);
    }

    public long getBatchExecutionEnd() {
      return getValue(FABRIC_BATCH_EXECUTION_END);
    }

    public long getUpdateUIMainThreadStart() {
      return getValue(FABRIC_UPDATE_UI_MAIN_THREAD_START);
    }

    public long getUpdateUIMainThreadEnd() {
      return getValue(FABRIC_UPDATE_UI_MAIN_THREAD_END);
    }
  }

  public void addDevToolsReactPerfLoggerListener(DevToolsReactPerfLoggerListener listener) {
    mDevToolsReactPerfLoggerListeners.add(listener);
  }

  public void removeDevToolsReactPerfLoggerListener(DevToolsReactPerfLoggerListener listener) {
    mDevToolsReactPerfLoggerListeners.remove(listener);
  }

  @Override
  public void logFabricMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey, long timestamp) {

    if (isFabricCommitMarker(name)) {
      FabricCommitPoint commitPoint = mFabricCommitMarkers.get(instanceKey);
      if (commitPoint == null) {
        commitPoint = new FabricCommitPoint(instanceKey);
        mFabricCommitMarkers.put(instanceKey, commitPoint);
      }
      commitPoint.addPoint(name, timestamp);

      if (name == ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END) {
        onFabricCommitEnd(commitPoint);
        mFabricCommitMarkers.remove(instanceKey);
      }
    }
  }

  private void onFabricCommitEnd(FabricCommitPoint commitPoint) {
    for (DevToolsReactPerfLoggerListener listener : mDevToolsReactPerfLoggerListeners) {
      listener.onFabricCommitEnd(commitPoint);
    }
  }

  private static boolean isFabricCommitMarker(ReactMarkerConstants name) {
    return name == FABRIC_COMMIT_START
        || name == FABRIC_COMMIT_END
        || name == FABRIC_FINISH_TRANSACTION_START
        || name == FABRIC_FINISH_TRANSACTION_END
        || name == FABRIC_DIFF_START
        || name == FABRIC_DIFF_END
        || name == FABRIC_LAYOUT_START
        || name == FABRIC_LAYOUT_END
        || name == FABRIC_BATCH_EXECUTION_START
        || name == FABRIC_BATCH_EXECUTION_END
        || name == FABRIC_UPDATE_UI_MAIN_THREAD_START
        || name == FABRIC_UPDATE_UI_MAIN_THREAD_END;
  }
}
