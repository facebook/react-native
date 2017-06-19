/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class JSCJavaScriptExecutor extends JavaScriptExecutor {
  public static class Factory implements JavaScriptExecutor.Factory {
    private ReadableNativeArray mJSCConfig;

    public Factory(WritableNativeMap jscConfig) {
      // TODO (t10707444): use NativeMap, which requires moving NativeMap out of OnLoad.
      WritableNativeArray array = new WritableNativeArray();
      array.pushMap(jscConfig);
      mJSCConfig = array;
    }

    @Override
    public JavaScriptExecutor create() throws Exception {
      return new JSCJavaScriptExecutor(mJSCConfig);
    }
  }

  static {
    ReactBridge.staticInit();
  }

  public JSCJavaScriptExecutor(ReadableNativeArray jscConfig) {
    super(initHybrid(jscConfig));
  }

  private native static HybridData initHybrid(ReadableNativeArray jscConfig);
}
