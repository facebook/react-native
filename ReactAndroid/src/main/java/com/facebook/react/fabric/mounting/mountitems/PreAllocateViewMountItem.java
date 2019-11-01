/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.DEBUG;
import static com.facebook.react.fabric.FabricUIManager.TAG;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;

/** {@link MountItem} that is used to pre-allocate views for JS components. */
public class PreAllocateViewMountItem implements MountItem {

  @NonNull private final String mComponent;
  private final int mRootTag;
  private final int mReactTag;
  private final @Nullable ReadableMap mProps;
  private final @Nullable StateWrapper mStateWrapper;
  private final @NonNull ThemedReactContext mContext;
  private final boolean mIsLayoutable;

  public PreAllocateViewMountItem(
      @NonNull ThemedReactContext context,
      int rootTag,
      int reactTag,
      @NonNull String component,
      @Nullable ReadableMap props,
      @NonNull StateWrapper stateWrapper,
      boolean isLayoutable) {
    mContext = context;
    mComponent = component;
    mRootTag = rootTag;
    mProps = props;
    mStateWrapper = stateWrapper;
    mReactTag = reactTag;
    mIsLayoutable = isLayoutable;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    if (DEBUG) {
      FLog.d(TAG, "Executing pre-allocation of: " + toString());
    }
    mountingManager.preallocateView(
        mContext, mComponent, mReactTag, mProps, mStateWrapper, mIsLayoutable);
  }

  @Override
  public String toString() {
    return "PreAllocateViewMountItem ["
        + mReactTag
        + "] - component: "
        + mComponent
        + " rootTag: "
        + mRootTag
        + " isLayoutable: "
        + mIsLayoutable;
  }
}
