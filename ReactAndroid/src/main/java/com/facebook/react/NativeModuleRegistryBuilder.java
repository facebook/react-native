// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.ModuleHolder;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.NativeModuleRegistry;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.model.ReactModuleInfo;

/**
 * Helper class to build NativeModuleRegistry.
 */
public class NativeModuleRegistryBuilder {

  private final ReactApplicationContext mReactApplicationContext;
  private final ReactInstanceManager mReactInstanceManager;

  private final Map<String, ModuleHolder> mModules = new HashMap<>();
  private final Map<String,String> namesToType = new HashMap<>();

  public NativeModuleRegistryBuilder(
    ReactApplicationContext reactApplicationContext,
    ReactInstanceManager reactInstanceManager) {
    mReactApplicationContext = reactApplicationContext;
    mReactInstanceManager = reactInstanceManager;
  }

  public void processPackage(ReactPackage reactPackage) {
    if (reactPackage instanceof LazyReactPackage) {
      LazyReactPackage lazyReactPackage = (LazyReactPackage) reactPackage;
      List<ModuleSpec> moduleSpecs = lazyReactPackage.getNativeModules(mReactApplicationContext);
      Map<String, ReactModuleInfo> reactModuleInfoMap =
          lazyReactPackage.getReactModuleInfoProvider().getReactModuleInfos();

      for (ModuleSpec moduleSpec : moduleSpecs) {
        String className = moduleSpec.getClassName();
        ReactModuleInfo reactModuleInfo = reactModuleInfoMap.get(className);
        ModuleHolder moduleHolder;
        if (reactModuleInfo == null) {
          NativeModule module;
          ReactMarker.logMarker(
            ReactMarkerConstants.CREATE_MODULE_START,
            moduleSpec.getClassName());
          try {
            module = moduleSpec.getProvider().get();
          } finally {
            ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END);
          }
          moduleHolder = new ModuleHolder(module);
        } else {
          moduleHolder = new ModuleHolder(reactModuleInfo, moduleSpec.getProvider());
        }

        String name = moduleHolder.getName();
        putModuleTypeAndHolderToModuleMaps(className, name, moduleHolder);
      }
    } else {
      FLog.d(
          ReactConstants.TAG,
          reactPackage.getClass().getSimpleName()
              + " is not a LazyReactPackage, falling back to old version.");
      List<NativeModule> nativeModules;
      if (reactPackage instanceof ReactInstancePackage) {
        ReactInstancePackage reactInstancePackage = (ReactInstancePackage) reactPackage;
        nativeModules =
            reactInstancePackage.createNativeModules(
                mReactApplicationContext, mReactInstanceManager);
      } else {
        nativeModules = reactPackage.createNativeModules(mReactApplicationContext);
      }
      for (NativeModule nativeModule : nativeModules) {
        addNativeModule(nativeModule);
      }
    }
  }

  public void addNativeModule(NativeModule nativeModule) {
    String name = nativeModule.getName();
    Class<? extends NativeModule> type = nativeModule.getClass();
    putModuleTypeAndHolderToModuleMaps(type.getName(), name, new ModuleHolder(nativeModule));
  }

  private void putModuleTypeAndHolderToModuleMaps(
      String className, String underName, ModuleHolder moduleHolder)
      throws IllegalStateException {
    if (namesToType.containsKey(underName)) {
      String existingNativeModule = namesToType.get(underName);
      if (!moduleHolder.getCanOverrideExistingModule()) {
        throw new IllegalStateException(
            "Native module "
                + className
                + " tried to override "
                + existingNativeModule
                + " for module name "
                + underName
                + ". Check the getPackages() method in MainApplication.java, it might be "
                + "that module is being created twice. "
                + "If this was your intention, set canOverrideExistingModule=true");
      }

      mModules.remove(existingNativeModule);
    }

    namesToType.put(underName, className);
    mModules.put(className, moduleHolder);
  }

  public NativeModuleRegistry build() {
    return new NativeModuleRegistry(
        mReactApplicationContext, mModules);
  }
}
