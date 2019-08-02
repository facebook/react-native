/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;

/** Package defining core debug only modules. */
@ReactModuleList(
    nativeModules = {
      JSCHeapCapture.class,
    })
public class DebugCorePackage extends TurboReactPackage {
  public DebugCorePackage() {}

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    switch (name) {
      case JSCHeapCapture.TAG:
        return new JSCHeapCapture(reactContext);
      default:
        throw new IllegalArgumentException(
            "In DebugCorePackage, could not find Native module for " + name);
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new com.facebook.react.DebugCorePackage$$ReactModuleInfoProvider();
  }
}
