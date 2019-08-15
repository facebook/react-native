/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

package com.facebook.react.jscexecutor;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.soloader.SoLoader;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;

@DoNotStrip
/* package */ class JSCExecutor extends JavaScriptExecutor {
  static {
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_JSC_SO_FILE_START);
    SoLoader.loadLibrary("jscexecutor");
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_JSC_SO_FILE_END);
  }

  /* package */ JSCExecutor(ReadableNativeMap jscConfig) {
    super(initHybrid(jscConfig));
  }

  @Override
  public String getName() {
    return "JSCExecutor";
  }

  private static native HybridData initHybrid(ReadableNativeMap jscConfig);
}
