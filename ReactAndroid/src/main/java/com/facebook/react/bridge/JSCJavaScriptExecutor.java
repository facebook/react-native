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
    private ReadableNativeMap mJSCConfig;

    public Factory(WritableNativeMap jscConfig) {
      jscConfig.putString("OwnerIdentity", "ReactNative");
      mJSCConfig = jscConfig;
    }

    @Override
    public JavaScriptExecutor create() throws Exception {
      return new JSCJavaScriptExecutor(mJSCConfig);
    }
  }

  static {
    ReactBridge.staticInit();
  }

  public JSCJavaScriptExecutor(ReadableNativeMap jscConfig) {
    super(initHybrid(jscConfig));
  }

  private native static HybridData initHybrid(ReadableNativeMap jscConfig);
}
