// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

import com.facebook.csslayout.CSSNode;
import com.facebook.react.common.ClearableSynchronizedPool;

/**
 * Static holder for a recycling pool of CSSNodes.
 */
public class CSSNodePool {

  private static final Object sInitLock = new Object();
  private static ClearableSynchronizedPool<CSSNode> sPool;

  public static ClearableSynchronizedPool<CSSNode> get() {
    if (sPool != null) {
      return sPool;
    }

    synchronized (sInitLock) {
      if (sPool == null) {
        sPool = new ClearableSynchronizedPool<CSSNode>(1024);
      }
      return sPool;
    }
  }
}
