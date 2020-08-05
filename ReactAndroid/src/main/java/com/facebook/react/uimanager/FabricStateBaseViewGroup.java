/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.config.ReactFeatureFlags;

/** This is a helper base class for ViewGroups that use Fabric State. */
public abstract class FabricStateBaseViewGroup extends ViewGroup {
  public interface StateUpdateCallback {
    WritableMap getStateUpdate();
  }

  private StateWrapper mStateWrapper = null;

  public FabricStateBaseViewGroup(ThemedReactContext context) {
    super(context);
  }

  public void setStateWrapper(StateWrapper stateWrapper) {
    mStateWrapper = stateWrapper;
  }

  private static void setState(
      final FabricStateBaseViewGroup view,
      final StateWrapper stateWrapper,
      final StateUpdateCallback stateUpdateCallback,
      final int numTries) {
    // The StateWrapper will change, breaking this loop, whenever the UpdateState MountItem
    // is executed.
    // The caller is responsible for detecting if data is up-to-date, and doing nothing, or
    // detecting if state is stale and calling setState again.
    if (stateWrapper != view.mStateWrapper) {
      return;
    }
    // We arbitrarily bail out after a certain number of retries.
    // This is a pretty large number: in practice I've seen this number go over 50
    // with minimal/no visual jank.
    if (numTries > 5 * 60) {
      return;
    }

    stateWrapper.updateState(stateUpdateCallback.getStateUpdate());

    // An `updateState` call can fail, and there's no way to verify if it succeeds besides
    // waiting for a corresponding `StateUpdate` MountItem to be executed on some future UI tick.
    // So.... to resolve conflicts with updateState, we just keep firing it until it succeeds or
    // the View goes away.
    if (ReactFeatureFlags.enableExperimentalStateUpdateRetry) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              setState(view, stateWrapper, stateUpdateCallback, numTries + 1);
            }
          });
    }
  }

  public static void setState(
      final FabricStateBaseViewGroup view,
      final StateWrapper stateWrapper,
      final StateUpdateCallback stateUpdateCallback) {
    setState(view, stateWrapper, stateUpdateCallback, 0);
  }
}
