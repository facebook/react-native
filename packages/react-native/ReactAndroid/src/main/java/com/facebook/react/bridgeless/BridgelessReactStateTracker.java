/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class BridgelessReactStateTracker {
  final List<String> mStates = Collections.synchronizedList(new ArrayList<String>());
  final boolean mShouldTrackStates;

  BridgelessReactStateTracker(boolean shouldTrackStates) {
    mShouldTrackStates = shouldTrackStates;
  }

  public void enterState(String state) {
    FLog.w("BridgelessReact", state);
    if (mShouldTrackStates) {
      mStates.add(state);
    }
  }

  public void assertStateOrder(String... expectedStates) {
    // TODO: Implement
  }
}
