/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class JSCJavaScriptExecutor extends JavaScriptExecutor {
  public static class Factory implements JavaScriptExecutor.Factory {
    @Override
    public JavaScriptExecutor create(WritableNativeMap jscConfig) throws Exception {
      return new JSCJavaScriptExecutor(jscConfig);
    }
  }

  static {
    SoLoader.loadLibrary(ReactBridge.REACT_NATIVE_LIB);
  }

  public JSCJavaScriptExecutor(WritableNativeMap jscConfig) {
    initialize(jscConfig);
  }

  private native void initialize(WritableNativeMap jscConfig);

}
