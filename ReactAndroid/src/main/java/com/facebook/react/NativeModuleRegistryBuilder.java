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
import com.facebook.react.common.ReactConstants;
import com.facebook.react.cxxbridge.LegacyModuleInfo;
import com.facebook.react.cxxbridge.ModuleHolder;
import com.facebook.react.cxxbridge.NativeModuleRegistry;
import com.facebook.react.module.model.ReactModuleInfo;

/**
 * Helper class to build NativeModuleRegistry.
 */
public class NativeModuleRegistryBuilder {

  private final ReactApplicationContext mReactApplicationContext;
  private final boolean mLazyNativeModulesEnabled;

  private final Map<Class<? extends NativeModule>, ModuleHolder> mModules = new HashMap<>();
  private final Map<String, Class<? extends NativeModule>> namesToType = new HashMap<>();

  public NativeModuleRegistryBuilder(
    ReactApplicationContext reactApplicationContext,
    boolean lazyNativeModulesEnabled) {
    mReactApplicationContext = reactApplicationContext;
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
          NativeModule nativeModule = moduleSpec.getProvider().get();
          LegacyModuleInfo legacyModuleInfo = new LegacyModuleInfo(type, nativeModule);
          moduleHolder = new ModuleHolder(legacyModuleInfo, nativeModule);
        } else {
          moduleHolder = new ModuleHolder(reactModuleInfo, moduleSpec.getProvider());
        }

        String name = moduleHolder.getInfo().name();
        if (namesToType.containsKey(name)) {
          Class<? extends NativeModule> existingNativeModule = namesToType.get(name);
          if (!moduleHolder.getInfo().canOverrideExistingModule()) {
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
      for (NativeModule nativeModule : reactPackage.createNativeModules(mReactApplicationContext)) {
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
    LegacyModuleInfo legacyModuleInfo = new LegacyModuleInfo(type, nativeModule);
    ModuleHolder moduleHolder = new ModuleHolder(legacyModuleInfo, nativeModule);
    mModules.put(type, moduleHolder);
  }

  public NativeModuleRegistry build() {
    ArrayList<OnBatchCompleteListener> batchCompleteListenerModules = new ArrayList<>();
    for (Map.Entry<Class<? extends NativeModule>, ModuleHolder> entry : mModules.entrySet()) {
      Class<? extends NativeModule> type = entry.getKey();
      if (OnBatchCompleteListener.class.isAssignableFrom(type)) {
        final ModuleHolder moduleHolder = entry.getValue();
        batchCompleteListenerModules.add(new OnBatchCompleteListener() {
          @Override
          public void onBatchComplete() {
            OnBatchCompleteListener listener = (OnBatchCompleteListener) moduleHolder.getModule();
            listener.onBatchComplete();
          }
        });
      }
    }

    return new NativeModuleRegistry(mModules, batchCompleteListenerModules);
  }
}
