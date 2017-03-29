// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.OnBatchCompleteListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.cxxbridge.ModuleHolder;
import com.facebook.react.cxxbridge.NativeModuleRegistry;
import com.facebook.react.module.model.ReactModuleInfo;

/**
 * Helper class to build NativeModuleRegistry.
 */
public class NativeModuleRegistryBuilder {

  private final ReactApplicationContext mReactApplicationContext;
  private final ReactInstanceManager mReactInstanceManager;
  private final boolean mLazyNativeModulesEnabled;

  private final Map<Class<? extends NativeModule>, ModuleHolder> mModules = new HashMap<>();
  private final Map<String, Class<? extends NativeModule>> namesToType = new HashMap<>();

  public NativeModuleRegistryBuilder(
    ReactApplicationContext reactApplicationContext,
    ReactInstanceManager reactInstanceManager,
    boolean lazyNativeModulesEnabled) {
    mReactApplicationContext = reactApplicationContext;
    mReactInstanceManager = reactInstanceManager;
    mLazyNativeModulesEnabled = lazyNativeModulesEnabled;
  }

  public void processPackage(ReactPackage reactPackage) {
    if (mLazyNativeModulesEnabled) {
      if (!(reactPackage instanceof LazyReactPackage)) {
        throw new IllegalStateException("Lazy native modules requires all ReactPackage to " +
          "inherit from LazyReactPackage");
      }

      LazyReactPackage lazyReactPackage = (LazyReactPackage) reactPackage;
      List<ModuleSpec> moduleSpecs = lazyReactPackage.getNativeModules(mReactApplicationContext);
      Map<Class, ReactModuleInfo> reactModuleInfoMap = lazyReactPackage.getReactModuleInfoProvider()
        .getReactModuleInfos();

      for (ModuleSpec moduleSpec : moduleSpecs) {
        Class<? extends NativeModule> type = moduleSpec.getType();
        ReactModuleInfo reactModuleInfo = reactModuleInfoMap.get(type);
        ModuleHolder moduleHolder;
        if (reactModuleInfo == null) {
          if (BaseJavaModule.class.isAssignableFrom(type)) {
            throw new IllegalStateException("Native Java module " + type.getSimpleName() +
              " should be annotated with @ReactModule and added to a @ReactModuleList.");
          }
          ReactMarker.logMarker(
            ReactMarkerConstants.CREATE_MODULE_START,
            moduleSpec.getType().getName());
          NativeModule module = moduleSpec.getProvider().get();
          ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END);
          moduleHolder = new ModuleHolder(module);
        } else {
          moduleHolder = new ModuleHolder(
            reactModuleInfo.name(),
            reactModuleInfo.canOverrideExistingModule(),
            reactModuleInfo.supportsWebWorkers(),
            reactModuleInfo.needsEagerInit(),
            moduleSpec.getProvider());
        }

        String name = moduleHolder.getName();
        if (namesToType.containsKey(name)) {
          Class<? extends NativeModule> existingNativeModule = namesToType.get(name);
          if (!moduleHolder.getCanOverrideExistingModule()) {
            throw new IllegalStateException("Native module " + type.getSimpleName() +
              " tried to override " + existingNativeModule.getSimpleName() + " for module name " +
              name + ". If this was your intention, set canOverrideExistingModule=true");
          }

          mModules.remove(existingNativeModule);
        }

        namesToType.put(name, type);
        mModules.put(type, moduleHolder);
      }
    } else {
      FLog.d(
        ReactConstants.TAG,
        reactPackage.getClass().getSimpleName() +
          " is not a LazyReactPackage, falling back to old version.");
      List<NativeModule> nativeModules;
      if (reactPackage instanceof ReactInstancePackage) {
        ReactInstancePackage reactInstancePackage = (ReactInstancePackage) reactPackage;
        nativeModules = reactInstancePackage.createNativeModules(
            mReactApplicationContext,
            mReactInstanceManager);
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
    if (namesToType.containsKey(name)) {
      Class<? extends NativeModule> existingModule = namesToType.get(name);
      if (!nativeModule.canOverrideExistingModule()) {
        throw new IllegalStateException("Native module " + type.getSimpleName() +
          " tried to override " + existingModule.getSimpleName() + " for module name " +
          name + ". If this was your intention, set canOverrideExistingModule=true");
      }

      mModules.remove(existingModule);
    }

    namesToType.put(name, type);
    ModuleHolder moduleHolder = new ModuleHolder(nativeModule);
    mModules.put(type, moduleHolder);
  }

  public NativeModuleRegistry build() {
    ArrayList<ModuleHolder> batchCompleteListenerModules = new ArrayList<>();
    for (Map.Entry<Class<? extends NativeModule>, ModuleHolder> entry : mModules.entrySet()) {
      if (OnBatchCompleteListener.class.isAssignableFrom(entry.getKey())) {
        batchCompleteListenerModules.add(entry.getValue());
      }
    }

    return new NativeModuleRegistry(
      mReactApplicationContext,
      mModules,
      batchCompleteListenerModules);
  }
}
