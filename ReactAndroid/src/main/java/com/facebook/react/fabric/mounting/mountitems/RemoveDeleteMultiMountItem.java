/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.react.fabric.mounting.MountingManager;

public class RemoveDeleteMultiMountItem implements MountItem {

  // Metadata is an array of ints, grouped into 4 ints per instruction (so the length of metadata
  // is always divisible by 4):
  //
  // `instruction*4 + 0`: react tag of view instruction
  // `instruction*4 + 1`: react tag of view's parent
  // `instruction*4 + 2`: index of view in parents' children instruction
  // `instruction*4 + 3`: flags indicating if the view should be removed, and/or deleted
  @NonNull private int[] mMetadata;

  // Bitfields of "flag", indicating if a view should be removed and/or deleted
  private static final int REMOVE_FLAG = 1;
  private static final int DELETE_FLAG = 2;

  // Indices for each parameter within an "instruction"
  private static final int INSTRUCTION_FIELDS_LEN = 4;
  private static final int TAG_INDEX = 0;
  private static final int PARENT_TAG_INDEX = 1;
  private static final int VIEW_INDEX_INDEX = 2;
  private static final int FLAGS_INDEX = 3;

  public RemoveDeleteMultiMountItem(@NonNull int[] metadata) {
    mMetadata = metadata;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    // First, go through instructions and remove all views that are marked
    // for removal.
    // Not all views that are removed are deleted, and not all deleted views
    // are removed first.
    // *All* views must be removed here before we can delete any views.
    // Removal of a view from a parent is based on indices within the parents' children,
    // and deletion causes reordering; so we must perform all removals first.
    for (int i = 0; i < mMetadata.length; i += INSTRUCTION_FIELDS_LEN) {
      int flags = mMetadata[i + FLAGS_INDEX];
      if ((flags & REMOVE_FLAG) != 0) {
        int parentTag = mMetadata[i + PARENT_TAG_INDEX];
        int tag = mMetadata[i + TAG_INDEX];
        int index = mMetadata[i + VIEW_INDEX_INDEX];
        mountingManager.removeViewAt(tag, parentTag, index);
      }
    }

    // After removing all views, delete all views marked for deletion.
    for (int i = 0; i < mMetadata.length; i += 4) {
      int flags = mMetadata[i + FLAGS_INDEX];
      if ((flags & DELETE_FLAG) != 0) {
        int tag = mMetadata[i + TAG_INDEX];
        mountingManager.deleteView(tag);
      }
    }
  }

  @Override
  public String toString() {
    StringBuilder s = new StringBuilder();
    for (int i = 0; i < mMetadata.length; i += 4) {
      if (s.length() > 0) {
        s.append("\n");
      }
      s.append("RemoveDeleteMultiMountItem (")
          .append(i / INSTRUCTION_FIELDS_LEN + 1)
          .append("/")
          .append(mMetadata.length / INSTRUCTION_FIELDS_LEN)
          .append("): [")
          .append(mMetadata[i + TAG_INDEX])
          .append("] parent [")
          .append(mMetadata[i + PARENT_TAG_INDEX])
          .append("] idx ")
          .append(mMetadata[i + VIEW_INDEX_INDEX])
          .append(" ")
          .append(mMetadata[i + FLAGS_INDEX]);
    }
    return s.toString();
  }
}
