/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.systrace.Systrace;

/**
 * This class represents a batch of {@link MountItem}s
 *
 * <p>A MountItem batch contains an array of {@link MountItem} and a size. The size determines the
 * amount of items that needs to be processed in the array.
 *
 * <p>The purpose of encapsulating the array of MountItems this way, is to reduce the amount of
 * allocations in C++
 */
@DoNotStrip
public class BatchMountItem implements MountItem {
  static final String TAG = "FabricBatchMountItem";

  private final int mRootTag;
  @NonNull private final MountItem[] mMountItems;

  private final int mSize;

  private final int mCommitNumber;

  public BatchMountItem(int rootTag, MountItem[] items, int size, int commitNumber) {
    int itemsLength = (items == null ? 0 : items.length);
    if (size < 0 || size > itemsLength) {
      throw new IllegalArgumentException(
          "Invalid size received by parameter size: " + size + " items.size = " + itemsLength);
    }
    mRootTag = rootTag;
    mMountItems = items;
    mSize = size;
    mCommitNumber = commitNumber;
  }

  private void beginMarkers(String reason) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "FabricUIManager::" + reason + " - " + mSize + " items");

    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START, null, mCommitNumber);
    }
  }

  private void endMarkers() {
    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END, null, mCommitNumber);
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    beginMarkers("mountViews");

    int mountItemIndex = 0;
    try {
      for (; mountItemIndex < mSize; mountItemIndex++) {
        mMountItems[mountItemIndex].execute(mountingManager);
      }
    } catch (RuntimeException e) {
      FLog.e(
          TAG,
          "Caught exception executing mountItem @"
              + mountItemIndex
              + ": "
              + mMountItems[mountItemIndex].toString(),
          e);
      throw e;
    }

    endMarkers();
  }

  public int getRootTag() {
    return mRootTag;
  }

  public boolean shouldSchedule() {
    return mSize != 0;
  }

  @Override
  public String toString() {
    StringBuilder s = new StringBuilder();
    for (int i = 0; i < mSize; i++) {
      if (s.length() > 0) {
        s.append("\n");
      }
      s.append("BatchMountItem [S:" + mRootTag + "] (")
          .append(i + 1)
          .append("/")
          .append(mSize)
          .append("): ")
          .append(mMountItems[i]);
    }
    return s.toString();
  }
}
