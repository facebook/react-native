/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.proguard.annotations.DoNotStrip;
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

  public BatchMountItem(MountItem[] items, int size) {
    if (items == null) {
      throw new NullPointerException();
    }
    if (size < 0 || size > items.length) {
      throw new IllegalArgumentException(
          "Invalid size received by parameter size: " + size + " items.size = " + items.length);
    }
    mMountItems = items;
    mSize = size;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::mountViews (" + mSize + " items)");

    for (int mountItemIndex = 0; mountItemIndex < mSize; mountItemIndex++) {
      MountItem mountItem = mMountItems[mountItemIndex];
      mountItem.execute(mountingManager);
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }
}
