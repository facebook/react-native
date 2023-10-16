/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Nullsafe(Nullsafe.Mode.LOCAL)
class BridgelessReactStateTracker {
  private static final String TAG = "BridgelessReact";
  private final List<String> mStates = Collections.synchronizedList(new ArrayList<>());
  private final boolean mShouldTrackStates;

  BridgelessReactStateTracker(boolean shouldTrackStates) {
    mShouldTrackStates = shouldTrackStates;
  }

  void enterState(String state) {
    FLog.w(TAG, state);
    if (mShouldTrackStates) {
      mStates.add(state);
    }
  }
}
