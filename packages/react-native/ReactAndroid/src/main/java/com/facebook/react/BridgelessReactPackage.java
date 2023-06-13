/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.devsupport.LogBoxModule;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.debug.DevSettingsModule;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;

@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModuleList(
    nativeModules = {
      AndroidInfoModule.class,
      DeviceInfoModule.class,
      DevSettingsModule.class,
      SourceCodeModule.class,
      LogBoxModule.class,
      DeviceEventManagerModule.class,
    })
public class BridgelessReactPackage extends TurboReactPackage {

  private DevSupportManager mDevSupportManager;
  private DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;

  public BridgelessReactPackage(
      DevSupportManager devSupportManager, DefaultHardwareBackBtnHandler hardwareBackBtnHandler) {
    mDevSupportManager = devSupportManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
  }

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    switch (name) {
      case AndroidInfoModule.NAME:
        return new AndroidInfoModule(reactContext);
      case DeviceInfoModule.NAME:
        return new DeviceInfoModule(reactContext);
      case SourceCodeModule.NAME:
        return new SourceCodeModule(reactContext);
      case DevSettingsModule.NAME:
        return new DevSettingsModule(reactContext, mDevSupportManager);
      case DeviceEventManagerModule.NAME:
        return new DeviceEventManagerModule(reactContext, mHardwareBackBtnHandler);
      case LogBoxModule.NAME:
        return new LogBoxModule(reactContext, mDevSupportManager);
      default:
        throw new IllegalArgumentException(
            "In BridgelessReactPackage, could not find Native module for " + name);
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new BridgelessReactPackage$$ReactModuleInfoProvider();
  }
}
