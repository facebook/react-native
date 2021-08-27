/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.HashMap;
import java.util.Map;

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
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
    try {
      Class<?> reactModuleInfoProviderClass =
          Class.forName("com.facebook.react.DebugCorePackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      // In OSS case, the annotation processor does not run. We fall back on creating this by hand
      Class<? extends NativeModule>[] moduleList = new Class[] {JSCHeapCapture.class};

      final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
      for (Class<? extends NativeModule> moduleClass : moduleList) {
        ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

        reactModuleInfoMap.put(
            reactModule.name(),
            new ReactModuleInfo(
                reactModule.name(),
                moduleClass.getName(),
                reactModule.canOverrideExistingModule(),
                reactModule.needsEagerInit(),
                reactModule.hasConstants(),
                reactModule.isCxxModule(),
                TurboModule.class.isAssignableFrom(moduleClass)));
      }

      return new ReactModuleInfoProvider() {
        @Override
        public Map<String, ReactModuleInfo> getReactModuleInfos() {
          return reactModuleInfoMap;
        }
      };
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for DebugCorePackage$$ReactModuleInfoProvider", e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for DebugCorePackage$$ReactModuleInfoProvider", e);
    }
  }
}
