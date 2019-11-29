/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
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

  @NonNull private final MountItem[] mMountItems;

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
  public void execute(@NonNull MountingManager mountingManager) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::mountViews - " + mSize + " items");

    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START, null, mCommitNumber);
    }

    for (int mountItemIndex = 0; mountItemIndex < mSize; mountItemIndex++) {
      MountItem mountItem = mMountItems[mountItemIndex];
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
    StringBuilder s = new StringBuilder();
    for (int i = 0; i < mSize; i++) {
      if (s.length() > 0) {
        s.append("\n");
      }
      s.append("BatchMountItem (")
          .append(i + 1)
          .append("/")
          .append(mSize)
          .append("): ")
          .append(mMountItems[i]);
    }
    return s.toString();
  }
}
