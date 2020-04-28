/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.DEBUG;
import static com.facebook.react.fabric.FabricUIManager.TAG;

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

  private final MountItem[] mMountItems;
  private final int mSize;
  private final int mCommitNumber;

  public BatchMountItem(MountItem[] items, int size, int commitNumber) {
    if (items == null) {
      throw new NullPointerException();
    }
    if (size < 0 || size > items.length) {
      throw new IllegalArgumentException(
          "Invalid size received by parameter size: " + size + " items.size = " + items.length);
    }
    mMountItems = items;
    mSize = size;
    mCommitNumber = commitNumber;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::mountViews - " + mSize + " items");

    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START, null, mCommitNumber);
    }

    for (int mountItemIndex = 0; mountItemIndex < mSize; mountItemIndex++) {
      MountItem mountItem = mMountItems[mountItemIndex];
      if (DEBUG) {
        FLog.d(TAG, "Executing mountItem: " + mountItem);
      }
      mountItem.execute(mountingManager);
    }

    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END, null, mCommitNumber);
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  @Override
  public String toString() {
    return "BatchMountItem - size " + mMountItems.length;
  }
}
