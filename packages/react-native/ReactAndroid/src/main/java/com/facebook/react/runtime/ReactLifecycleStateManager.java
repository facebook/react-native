/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.app.Activity;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;

@Nullsafe(Nullsafe.Mode.LOCAL)
class ReactLifecycleStateManager {
  LifecycleState mState = LifecycleState.BEFORE_CREATE;
  private final BridgelessReactStateTracker mBridgelessReactStateTracker;

  ReactLifecycleStateManager(BridgelessReactStateTracker bridgelessReactStateTracker) {
    mBridgelessReactStateTracker = bridgelessReactStateTracker;
  }

  public LifecycleState getLifecycleState() {
    return mState;
  }

  @ThreadConfined(UI)
  public void resumeReactContextIfHostResumed(
      final ReactContext currentContext, final @Nullable Activity activity) {
    if (mState == LifecycleState.RESUMED) {
      mBridgelessReactStateTracker.enterState("ReactContext.onHostResume()");
      currentContext.onHostResume(activity);
    }
  }

  @ThreadConfined(UI)
  public void moveToOnHostResume(
      final @Nullable ReactContext currentContext, final @Nullable Activity activity) {
    if (mState == LifecycleState.RESUMED) {
      return;
    }

    if (currentContext != null) {
      mBridgelessReactStateTracker.enterState("ReactContext.onHostResume()");
      currentContext.onHostResume(activity);
    }
    mState = LifecycleState.RESUMED;
  }

  @ThreadConfined(UI)
  public void moveToOnHostPause(
      final @Nullable ReactContext currentContext, final @Nullable Activity activity) {
    if (currentContext != null) {
      if (mState == LifecycleState.BEFORE_CREATE) {
        // TODO: Investigate if we can remove this transition.
        mBridgelessReactStateTracker.enterState("ReactContext.onHostResume()");
        currentContext.onHostResume(activity);
        mBridgelessReactStateTracker.enterState("ReactContext.onHostPause()");
        currentContext.onHostPause();
      } else if (mState == LifecycleState.RESUMED) {
        mBridgelessReactStateTracker.enterState("ReactContext.onHostPause()");
        currentContext.onHostPause();
      }
    }

    mState = LifecycleState.BEFORE_RESUME;
  }

  @ThreadConfined(UI)
  public void moveToOnHostDestroy(final @Nullable ReactContext currentContext) {
    if (currentContext != null) {
      if (mState == LifecycleState.BEFORE_RESUME) {
        mBridgelessReactStateTracker.enterState("ReactContext.onHostDestroy()");
        currentContext.onHostDestroy();
      } else if (mState == LifecycleState.RESUMED) {
        mBridgelessReactStateTracker.enterState("ReactContext.onHostPause()");
        currentContext.onHostPause();
        mBridgelessReactStateTracker.enterState("ReactContext.onHostDestroy()");
        currentContext.onHostDestroy();
      }
    }

    mState = LifecycleState.BEFORE_CREATE;
  }
}
