/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.infer.annotation.Assertions;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
  * A set of Java APIs to expose to a particular JavaScript instance.
  */
public class NativeModuleRegistry {

  private final ReactApplicationContext mReactApplicationContext;
  private final Map<String, ModuleHolder> mModules;

  public NativeModuleRegistry(
    ReactApplicationContext reactApplicationContext,
    Map<String, ModuleHolder> modules) {
    mReactApplicationContext = reactApplicationContext;
    mModules = modules;
  }

  /**
   * Private getters for combining NativeModuleRegistrys
   */
  private Map<String, ModuleHolder> getModuleMap() {
    return mModules;
  }

  private ReactApplicationContext getReactApplicationContext() {
    return mReactApplicationContext;
  }

  /* package */ Collection<JavaModuleWrapper> getJavaModules(
      JSInstance jsInstance) {
    ArrayList<JavaModuleWrapper> javaModules = new ArrayList<>();
    for (Map.Entry<String, ModuleHolder> entry : mModules.entrySet()) {
      String type = entry.getKey();
      if (!entry.getValue().isCxxModule()) {
      //if (!CxxModuleWrapperBase.class.isAssignableFrom(entry.getValue().getModule().getClass())) {
        javaModules.add(new JavaModuleWrapper(jsInstance, type, entry.getValue()));
      }
    }
    return javaModules;
  }

  /* package */ Collection<ModuleHolder> getCxxModules() {
    ArrayList<ModuleHolder> cxxModules = new ArrayList<>();
    for (Map.Entry<String, ModuleHolder> entry : mModules.entrySet()) {
      if (entry.getValue().isCxxModule()) {
        cxxModules.add(entry.getValue());
      }
    }
    return cxxModules;
  }

  /*
  * Adds any new modules to the current module registry
  */
  /* package */ void registerModules(NativeModuleRegistry newRegister) {

    Assertions.assertCondition(mReactApplicationContext.equals(newRegister.getReactApplicationContext()),
      "Extending native modules with non-matching application contexts.");

    Map<String, ModuleHolder> newModules = newRegister.getModuleMap();

    for (Map.Entry<String, ModuleHolder> entry : newModules.entrySet()) {
      String key = entry.getKey();
      if (!mModules.containsKey(key)) {
        ModuleHolder value = entry.getValue();
        mModules.put(key, value);
      }
    }
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
    // The only native module that uses the onBatchComplete is the UI Manager. Hence, instead of
    // iterating over all the modules for find this one instance, and then calling it, we short-circuit
    // the search, and simply call OnBatchComplete on the UI Manager.
    // With Fabric, UIManager would no longer be a NativeModule, so this call would simply go away
    ModuleHolder moduleHolder = mModules.get("com.facebook.react.uimanager.UIManagerModule");
    if (moduleHolder != null && moduleHolder.hasInstance()) {
      ((OnBatchCompleteListener) moduleHolder.getModule()).onBatchComplete();
    }
  }

  public <T extends NativeModule> boolean hasModule(Class<T> moduleInterface) {
    return mModules.containsKey(moduleInterface.getName());
  }

  public <T extends NativeModule> T getModule(Class<T> moduleInterface) {
    return (T) Assertions.assertNotNull(
        mModules.get(moduleInterface.getName()), moduleInterface.getSimpleName()).getModule();
  }

  public List<NativeModule> getAllModules() {
    List<NativeModule> modules = new ArrayList<>();
    for (ModuleHolder module : mModules.values()) {
      modules.add(module.getModule());
    }
    return modules;
  }
}
