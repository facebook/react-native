/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;

public class CreateMountItem implements MountItem {

  @NonNull private final String mComponent;
  private final int mRootTag;
  private final int mReactTag;
  @NonNull private final ThemedReactContext mContext;
  private final @Nullable ReadableMap mProps;
  private final @Nullable StateWrapper mStateWrapper;
  private final boolean mIsLayoutable;

  public CreateMountItem(
      @Nullable ThemedReactContext context,
      int rootTag,
      int reactTag,
      @NonNull String component,
      @Nullable ReadableMap props,
      @NonNull StateWrapper stateWrapper,
      boolean isLayoutable) {
    mContext = context;
    mComponent = component;
    mRootTag = rootTag;
    mReactTag = reactTag;
    mProps = props;
    mStateWrapper = stateWrapper;
    mIsLayoutable = isLayoutable;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    if (mContext == null) {
      throw new IllegalStateException(
          "Cannot execute PreAllocateViewMountItem without Context for ReactTag: "
              + mReactTag
              + " and rootTag: "
              + mRootTag);
    }
    mountingManager.createView(
        mContext, mComponent, mReactTag, mProps, mStateWrapper, mIsLayoutable);
  }

  @Override
  public String toString() {
    return "CreateMountItem ["
        + mReactTag
        + "] - component: "
        + mComponent
        + " - rootTag: "
        + mRootTag
        + " - isLayoutable: "
        + mIsLayoutable;
  }
}
