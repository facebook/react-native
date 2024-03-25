/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_COMMIT_END;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_COMMIT_START;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_DIFF_END;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_DIFF_START;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_END;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_START;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_LAYOUT_AFFECTED_NODES;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_LAYOUT_END;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_LAYOUT_START;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END;
import static com.facebook.react.bridge.ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_START;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class DevToolsReactPerfLogger implements ReactMarker.FabricMarkerListener {

  private final Map<Integer, FabricCommitPoint> mFabricCommitMarkers = new HashMap<>();
  private final List<DevToolsReactPerfLoggerListener> mDevToolsReactPerfLoggerListeners =
      new ArrayList<>();

  public static final LongStreamingStats mStreamingCommitStats = new LongStreamingStats();
  public static final LongStreamingStats mStreamingLayoutStats = new LongStreamingStats();
  public static final LongStreamingStats mStreamingDiffStats = new LongStreamingStats();
  public static final LongStreamingStats mStreamingTransactionEndStats = new LongStreamingStats();
  public static final LongStreamingStats mStreamingBatchExecutionStats = new LongStreamingStats();

  public interface DevToolsReactPerfLoggerListener {

    void onFabricCommitEnd(FabricCommitPoint commitPoint);
  }

  public static class FabricCommitPointData {
    private final long mTimeStamp;
    private final int mCounter;

    public FabricCommitPointData(long timeStamp, int counter) {
      mTimeStamp = timeStamp;
      mCounter = counter;
    }

    public long getTimeStamp() {
      return mTimeStamp;
    }

    public int getCounter() {
      return mCounter;
    }
  }

  public static class FabricCommitPoint {
    private final long mCommitNumber;
    private final Map<ReactMarkerConstants, FabricCommitPointData> mPoints = new HashMap<>();

    private FabricCommitPoint(int commitNumber) {
      mCommitNumber = commitNumber;
    }

    private void addPoint(ReactMarkerConstants key, FabricCommitPointData data) {
      mPoints.put(key, data);
    }

    private long getTimestamp(ReactMarkerConstants marker) {
      FabricCommitPointData data = mPoints.get(marker);
      return data != null ? data.getTimeStamp() : -1;
    }

    private int getCounter(ReactMarkerConstants marker) {
      FabricCommitPointData data = mPoints.get(marker);
      return data != null ? data.getCounter() : 0;
    }

    public long getCommitNumber() {
      return mCommitNumber;
    }

    public long getCommitStart() {
      return getTimestamp(FABRIC_COMMIT_START);
    }

    public long getCommitEnd() {
      return getTimestamp(FABRIC_COMMIT_END);
    }

    public long getFinishTransactionStart() {
      return getTimestamp(FABRIC_FINISH_TRANSACTION_START);
    }

    public long getFinishTransactionEnd() {
      return getTimestamp(FABRIC_FINISH_TRANSACTION_END);
    }

    public long getDiffStart() {
      return getTimestamp(FABRIC_DIFF_START);
    }

    public long getDiffEnd() {
      return getTimestamp(FABRIC_DIFF_END);
    }

    public long getLayoutStart() {
      return getTimestamp(FABRIC_LAYOUT_START);
    }

    public long getLayoutEnd() {
      return getTimestamp(FABRIC_LAYOUT_END);
    }

    public int getAffectedLayoutNodesCount() {
      return getCounter(FABRIC_LAYOUT_AFFECTED_NODES);
    }

    public long getAffectedLayoutNodesCountTime() {
      return getTimestamp(FABRIC_LAYOUT_AFFECTED_NODES);
    }

    public long getBatchExecutionStart() {
      return getTimestamp(FABRIC_BATCH_EXECUTION_START);
    }

    public long getBatchExecutionEnd() {
      return getTimestamp(FABRIC_BATCH_EXECUTION_END);
    }

    public long getUpdateUIMainThreadStart() {
      return getTimestamp(FABRIC_UPDATE_UI_MAIN_THREAD_START);
    }

    public long getUpdateUIMainThreadEnd() {
      return getTimestamp(FABRIC_UPDATE_UI_MAIN_THREAD_END);
    }

    // Duration calculations
    public long getCommitDuration() {
      return getCommitEnd() - getCommitStart();
    }

    public long getLayoutDuration() {
      return getLayoutEnd() - getLayoutStart();
    }

    public long getDiffDuration() {
      return getDiffEnd() - getDiffStart();
    }

    public long getTransactionEndDuration() {
      return getFinishTransactionEnd() - getFinishTransactionStart();
    }

    public long getBatchExecutionDuration() {
      return getBatchExecutionEnd() - getBatchExecutionStart();
    }

    @Override
    public String toString() {
      StringBuilder builder = new StringBuilder("FabricCommitPoint{");
      builder.append("mCommitNumber=").append(mCommitNumber);
      builder.append(", mPoints=").append(mPoints);
      builder.append('}');
      return builder.toString();
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
    logFabricMarker(name, tag, instanceKey, timestamp, 0);
  }

  @Override
  public void logFabricMarker(
      ReactMarkerConstants name,
      @Nullable String tag,
      int instanceKey,
      long timestamp,
      int counter) {

    if (isFabricCommitMarker(name)) {
      FabricCommitPoint commitPoint = mFabricCommitMarkers.get(instanceKey);
      if (commitPoint == null) {
        commitPoint = new FabricCommitPoint(instanceKey);
        mFabricCommitMarkers.put(instanceKey, commitPoint);
      }
      commitPoint.addPoint(name, new FabricCommitPointData(timestamp, counter));

      if (name == ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END && timestamp > 0) {
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
        || name == FABRIC_UPDATE_UI_MAIN_THREAD_END
        || name == FABRIC_LAYOUT_AFFECTED_NODES;
  }
}
