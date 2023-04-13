/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.modules;

import androidx.annotation.Nullable;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import java.util.HashMap;
import java.util.Map;

public class DoublerPackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(DoublerModule.NAME)) {
      return new DoublerModule(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      moduleInfos.put(
          DoublerModule.NAME,
          new ReactModuleInfo(
              DoublerModule.NAME,
              DoublerModule.NAME,
              false, // canOverrideExistingModule
              false, // needsEagerInit
              true, // hasConstants
              false, // isCxxModule
              true // isTurboModule
              ));
      return moduleInfos;
    };
  }
}
