/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public abstract class JavaScriptExecutor {
  public interface Factory {
    JavaScriptExecutor create() throws Exception;
  }

  private final HybridData mHybridData;

  protected JavaScriptExecutor(HybridData hybridData) {
    mHybridData = hybridData;
  }

  /**
   * Close this executor and cleanup any resources that it was using. No further calls are
   * expected after this.
   * TODO mhorowitz: This may no longer be used; check and delete if possible.
   */
  public void close() {
    mHybridData.resetNative();
  }
}
