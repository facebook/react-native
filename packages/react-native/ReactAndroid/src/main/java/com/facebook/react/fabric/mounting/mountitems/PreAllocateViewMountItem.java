/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;
import static com.facebook.react.fabric.FabricUIManager.TAG;
import static com.facebook.react.fabric.mounting.mountitems.FabricNameComponentMapping.getFabricComponentName;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.SurfaceMountingManager;
import com.facebook.react.uimanager.StateWrapper;

/** {@link MountItem} that is used to pre-allocate views for JS components. */
@Nullsafe(Nullsafe.Mode.LOCAL)
final class PreAllocateViewMountItem implements MountItem {

  private final @NonNull String mComponent;
  private final int mSurfaceId;
  private final int mReactTag;
  private final @Nullable ReadableMap mProps;
  private final @Nullable StateWrapper mStateWrapper;
  private final @Nullable EventEmitterWrapper mEventEmitterWrapper;
  private final boolean mIsLayoutable;

  PreAllocateViewMountItem(
      int surfaceId,
      int reactTag,
      @NonNull String component,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      @Nullable EventEmitterWrapper eventEmitterWrapper,
      boolean isLayoutable) {
    mComponent = getFabricComponentName(component);
    mSurfaceId = surfaceId;
    mProps = props;
    mStateWrapper = stateWrapper;
    mEventEmitterWrapper = eventEmitterWrapper;
    mReactTag = reactTag;
    mIsLayoutable = isLayoutable;
  }

  @Override
  public int getSurfaceId() {
    return mSurfaceId;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    SurfaceMountingManager surfaceMountingManager = mountingManager.getSurfaceManager(mSurfaceId);
    if (surfaceMountingManager == null) {
      FLog.e(
          TAG,
          "Skipping View PreAllocation; no SurfaceMountingManager found for [" + mSurfaceId + "]");
      return;
    }
    surfaceMountingManager.preallocateView(
        mComponent, mReactTag, mProps, mStateWrapper, mEventEmitterWrapper, mIsLayoutable);
  }

  @Override
  @NonNull
  public String toString() {
    StringBuilder result =
        new StringBuilder("PreAllocateViewMountItem [")
            .append(mReactTag)
            .append("] - component: ")
            .append(mComponent)
            .append(" surfaceId: ")
            .append(mSurfaceId)
            .append(" isLayoutable: ")
            .append(mIsLayoutable);

    if (IS_DEVELOPMENT_ENVIRONMENT) {
      result
          .append(" props: ")
          .append(mProps != null ? mProps : "<null>")
          .append(" state: ")
          .append(
              mStateWrapper != null && mStateWrapper.getStateData() != null
                  ? mStateWrapper.getStateData().toString()
                  : "<null>");
    }

    return result.toString();
  }
}
