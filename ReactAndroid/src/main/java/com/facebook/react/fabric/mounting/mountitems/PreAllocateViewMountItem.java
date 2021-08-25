/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.ENABLE_FABRIC_LOGS;
import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;
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

  public int getRootTag() {
    return mRootTag;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Executing pre-allocation of: " + toString());
    }
    mountingManager.preallocateView(
        mContext, mComponent, mReactTag, mProps, mStateWrapper, mIsLayoutable);
  }

  @Override
  public String toString() {
    StringBuilder result =
        new StringBuilder("PreAllocateViewMountItem [")
            .append(mReactTag)
            .append("] - component: ")
            .append(mComponent)
            .append(" rootTag: ")
            .append(mRootTag)
            .append(" isLayoutable: ")
            .append(mIsLayoutable);

    if (IS_DEVELOPMENT_ENVIRONMENT) {
      result
          .append(" props: ")
          .append(mProps != null ? mProps : "<null>")
          .append(" state: ")
          .append(mStateWrapper != null ? mStateWrapper : "<null>");
    }

    return result.toString();
  }
}
