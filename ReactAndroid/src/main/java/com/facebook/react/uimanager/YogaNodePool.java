// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

import com.facebook.yoga.YogaNode;
import com.facebook.react.common.ClearableSynchronizedPool;

/**
 * Static holder for a recycling pool of YogaNodes.
 */
public class YogaNodePool {

  private static final Object sInitLock = new Object();
  private static ClearableSynchronizedPool<YogaNode> sPool;

  public static ClearableSynchronizedPool<YogaNode> get() {
    if (sPool != null) {
      return sPool;
    }

    synchronized (sInitLock) {
      if (sPool == null) {
        sPool = new ClearableSynchronizedPool<YogaNode>(1024);
      }
      return sPool;
    }
  }
}
