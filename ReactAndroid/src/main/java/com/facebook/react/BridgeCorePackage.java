/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import javax.inject.Provider;

import java.util.ArrayList;
import java.util.List;

import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ExceptionsManagerModule;
import com.facebook.react.modules.core.Timing;
import com.facebook.react.modules.debug.SourceCodeModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;

/**
 * Package defining core framework modules for basic JS interop.
 * It should be used for modules that are always necessary for interacting with
 * JS, not for modules that provide RN specific functionality
 */
@ReactModuleList(
  nativeModules = {
    AndroidInfoModule.class,
    DeviceEventManagerModule.class,
    ExceptionsManagerModule.class,
    HeadlessJsTaskSupportModule.class,
    SourceCodeModule.class,
    Timing.class,
    DeviceInfoModule.class,
  }
)
/* package */ class BridgeCorePackage extends LazyReactPackage {

  private final ReactInstanceManager mReactInstanceManager;
  private final DefaultHardwareBackBtnHandler mHardwareBackBtnHandler;

  BridgeCorePackage(
    ReactInstanceManager reactInstanceManager,
    DefaultHardwareBackBtnHandler hardwareBackBtnHandler) {
    mReactInstanceManager = reactInstanceManager;
    mHardwareBackBtnHandler = hardwareBackBtnHandler;
  }

  @Override
  public List<ModuleSpec> getNativeModules(final ReactApplicationContext reactContext) {
    List<ModuleSpec> moduleSpecList = new ArrayList<>();

    moduleSpecList.add(
      new ModuleSpec(AndroidInfoModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new AndroidInfoModule();
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(DeviceEventManagerModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new DeviceEventManagerModule(reactContext, mHardwareBackBtnHandler);
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(ExceptionsManagerModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new ExceptionsManagerModule(mReactInstanceManager.getDevSupportManager());
        }
      }));
    moduleSpecList
      .add(new ModuleSpec(HeadlessJsTaskSupportModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new HeadlessJsTaskSupportModule(reactContext);
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(SourceCodeModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new SourceCodeModule(reactContext);
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(Timing.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new Timing(reactContext, mReactInstanceManager.getDevSupportManager());
        }
      }));
    moduleSpecList.add(
      new ModuleSpec(DeviceInfoModule.class, new Provider<NativeModule>() {
        @Override
        public NativeModule get() {
          return new DeviceInfoModule(reactContext);
        }
      }));

    return moduleSpecList;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return LazyReactPackage.getReactModuleInfoProviderViaReflection(this);
  }
}
