/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.facebook.infer.annotation.Assertions;
import com.facebook.systrace.Systrace;

/**
  * A set of Java APIs to expose to a particular JavaScript instance.
  */
public class NativeModuleRegistry {

  private final ReactApplicationContext mReactApplicationContext;
  private final Map<Class<? extends NativeModule>, ModuleHolder> mModules;
  private final ArrayList<ModuleHolder> mBatchCompleteListenerModules;

  public NativeModuleRegistry(
    ReactApplicationContext reactApplicationContext,
    Map<Class<? extends NativeModule>, ModuleHolder> modules,
    ArrayList<ModuleHolder> batchCompleteListenerModules) {
    mReactApplicationContext = reactApplicationContext;
    mModules = modules;
    mBatchCompleteListenerModules = batchCompleteListenerModules;
  }

  /* package */ Collection<JavaModuleWrapper> getJavaModules(
      JSInstance jsInstance) {
    ArrayList<JavaModuleWrapper> javaModules = new ArrayList<>();
    for (Map.Entry<Class<? extends NativeModule>, ModuleHolder> entry : mModules.entrySet()) {
      Class<? extends NativeModule> type = entry.getKey();
      if (!CxxModuleWrapperBase.class.isAssignableFrom(type)) {
        javaModules.add(new JavaModuleWrapper(jsInstance, type, entry.getValue()));
      }
    }
    return javaModules;
  }

  /* package */ Collection<ModuleHolder> getCxxModules() {
    ArrayList<ModuleHolder> cxxModules = new ArrayList<>();
    for (Map.Entry<Class<? extends NativeModule>, ModuleHolder> entry : mModules.entrySet()) {
      Class<?> type = entry.getKey();
      if (CxxModuleWrapperBase.class.isAssignableFrom(type)) {
        cxxModules.add(entry.getValue());
      }
    }
    return cxxModules;
  }

  /* package */ void notifyJSInstanceDestroy() {
    mReactApplicationContext.assertOnNativeModulesQueueThread();
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "NativeModuleRegistry_notifyJSInstanceDestroy");
    try {
      for (ModuleHolder module : mModules.values()) {
        module.destroy();
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /* package */ void notifyJSInstanceInitialized() {
    mReactApplicationContext.assertOnNativeModulesQueueThread("From version React Native v0.44, " +
      "native modules are explicitly not initialized on the UI thread. See " +
      "https://github.com/facebook/react-native/wiki/Breaking-Changes#d4611211-reactnativeandroidbreaking-move-nativemodule-initialization-off-ui-thread---aaachiuuu " +
      " for more details.");
    ReactMarker.logMarker(ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_START);
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "NativeModuleRegistry_notifyJSInstanceInitialized");
    try {
      for (ModuleHolder module : mModules.values()) {
        module.markInitializable();
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_END);
    }
  }

  public void onBatchComplete() {
    for (ModuleHolder moduleHolder : mBatchCompleteListenerModules) {
      if (moduleHolder.hasInstance()) {
        ((OnBatchCompleteListener) moduleHolder.getModule()).onBatchComplete();
      }
    }
  }

  public <T extends NativeModule> boolean hasModule(Class<T> moduleInterface) {
    return mModules.containsKey(moduleInterface);
  }

  public <T extends NativeModule> T getModule(Class<T> moduleInterface) {
    return (T) Assertions.assertNotNull(mModules.get(moduleInterface)).getModule();
  }

  public List<NativeModule> getAllModules() {
    List<NativeModule> modules = new ArrayList<>();
    for (ModuleHolder module : mModules.values()) {
      modules.add(module.getModule());
    }
    return modules;
  }
}
