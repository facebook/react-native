// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import com.facebook.react.common.ClearableSynchronizedPool;
import com.facebook.yoga.YogaNode;

/** Static holder for a recycling pool of YogaNodes. */
public class YogaNodePool {

  private static final Object sInitLock = new Object();
  private static ClearableSynchronizedPool<YogaNode> sPool;

  public static ClearableSynchronizedPool<YogaNode> get() {
    if (sPool != null) {
      return sPool;
    }

    synchronized (sInitLock) {
      if (sPool == null) {
        sPool = new ClearableSynchronizedPool<>(1024);
      }
      return sPool;
    }
  }
}
