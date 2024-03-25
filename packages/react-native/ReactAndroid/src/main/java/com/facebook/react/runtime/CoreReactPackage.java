/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.devsupport.LogBoxModule;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.modules.debug.DevSettingsModule;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import java.util.HashMap;
import java.util.Map;

@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModuleList(
    nativeModules = {
      AndroidInfoModule.class,
      DeviceInfoModule.class,
      DevSettingsModule.class,
      SourceCodeModule.class,
      LogBoxModule.class,
      DeviceEventManagerModule.class,
      ExceptionsManagerModule.class,
    })
class CoreReactPackage extends TurboReactPackage {

  private final DevSupportManager mDevSupportManager;
  private final DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;

  public CoreReactPackage(
      DevSupportManager devSupportManager, DefaultHardwareBackBtnHandler hardwareBackBtnHandler) {
    mDevSupportManager = devSupportManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
  }

  @Override
  public @Nullable NativeModule getModule(String name, ReactApplicationContext reactContext) {
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
      case ExceptionsManagerModule.NAME:
        return new ExceptionsManagerModule(mDevSupportManager);
      default:
        return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    try {
      Class<?> reactModuleInfoProviderClass =
          Class.forName(CoreReactPackage.class.getName() + "$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      // In OSS case, the annotation processor does not run. We fall back on creating this byhand
      Class<? extends NativeModule>[] moduleList =
          new Class[] {
            AndroidInfoModule.class,
            DeviceInfoModule.class,
            SourceCodeModule.class,
            DevSettingsModule.class,
            DeviceEventManagerModule.class,
            LogBoxModule.class,
            ExceptionsManagerModule.class,
          };
      final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
      for (Class<? extends NativeModule> moduleClass : moduleList) {
        ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);
        if (reactModule != null) {
          reactModuleInfoMap.put(
              reactModule.name(),
              new ReactModuleInfo(
                  reactModule.name(),
                  moduleClass.getName(),
                  reactModule.canOverrideExistingModule(),
                  reactModule.needsEagerInit(),
                  reactModule.isCxxModule(),
                  ReactModuleInfo.classIsTurboModule(moduleClass)));
        }
      }
      return () -> reactModuleInfoMap;
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for "
              + CoreReactPackage.class.getName()
              + "$$ReactModuleInfoProvider",
          e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for "
              + CoreReactPackage.class.getName()
              + "$$ReactModuleInfoProvider",
          e);
    }
  }
}
