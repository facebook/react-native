/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.react.bridge.ReactMarkerConstants.*;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import java.util.HashMap;
import java.util.Map;

public class ConsoleReactFabricPerfLogger implements ReactMarker.FabricMarkerListener {

  private final Map<Integer, FabricCommitPoint> mFabricCommitMarkers = new HashMap<>();

  private static class FabricCommitPoint {
    public long commitStart;
    public long commitEnd;
    public long finishTransactionStart;
    public long finishTransactionEnd;
    public long diffStart;
    public long diffEnd;
    public long updateUIMainThreadEnd;
    public long layoutStart;
    public long layoutEnd;
    public long batchExecutionStart;
    public long batchExecutionEnd;
    public long updateUIMainThreadStart;
  }

  @Override
  public void logFabricMarker(
      ReactMarkerConstants name, @Nullable String tag, int instanceKey, long timestamp) {

    if (isFabricCommitMarker(name)) {
      FabricCommitPoint commitPoint = mFabricCommitMarkers.get(instanceKey);
      if (commitPoint == null) {
        commitPoint = new FabricCommitPoint();
        mFabricCommitMarkers.put(instanceKey, commitPoint);
      }
      updateFabricCommitPoint(name, commitPoint, timestamp);

      if (name == ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END) {
        FLog.i(
            FabricUIManager.TAG,
            "Statistic of Fabric commit #: "
                + instanceKey
                + "\n - Total commit time: "
                + (commitPoint.finishTransactionEnd - commitPoint.commitStart)
                + " ms.\n - Layout: "
                + (commitPoint.layoutEnd - commitPoint.layoutStart)
                + " ms.\n - Diffing: "
                + (commitPoint.diffEnd - commitPoint.diffStart)
                + " ms.\n"
                + " - FinishTransaction (Diffing + Processing + Serialization of MutationInstructions): "
                + (commitPoint.finishTransactionEnd - commitPoint.finishTransactionStart)
                + " ms.\n"
                + " - Mounting: "
                + (commitPoint.batchExecutionEnd - commitPoint.batchExecutionStart)
                + " ms.");
        mFabricCommitMarkers.remove(instanceKey);
      }
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

  private static void updateFabricCommitPoint(
      ReactMarkerConstants name, FabricCommitPoint commitPoint, long timestamp) {
    switch (name) {
      case FABRIC_COMMIT_START:
        commitPoint.commitStart = timestamp;
        break;
      case FABRIC_COMMIT_END:
        commitPoint.commitEnd = timestamp;
        break;
      case FABRIC_FINISH_TRANSACTION_START:
        commitPoint.finishTransactionStart = timestamp;
        break;
      case FABRIC_FINISH_TRANSACTION_END:
        commitPoint.finishTransactionEnd = timestamp;
        break;
      case FABRIC_DIFF_START:
        commitPoint.diffStart = timestamp;
        break;
      case FABRIC_DIFF_END:
        commitPoint.diffEnd = timestamp;
        break;
      case FABRIC_LAYOUT_START:
        commitPoint.layoutStart = timestamp;
        break;
      case FABRIC_LAYOUT_END:
        commitPoint.layoutEnd = timestamp;
        break;
      case FABRIC_BATCH_EXECUTION_START:
        commitPoint.batchExecutionStart = timestamp;
        break;
      case FABRIC_BATCH_EXECUTION_END:
        commitPoint.batchExecutionEnd = timestamp;
        break;
      case FABRIC_UPDATE_UI_MAIN_THREAD_START:
        commitPoint.updateUIMainThreadStart = timestamp;
        break;
      case FABRIC_UPDATE_UI_MAIN_THREAD_END:
        commitPoint.updateUIMainThreadEnd = timestamp;
        break;
    }
  }
}
