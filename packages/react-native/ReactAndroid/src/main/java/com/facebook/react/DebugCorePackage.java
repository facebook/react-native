/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.ClassFinder;
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.debuggingoverlay.DebuggingOverlayManager;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.inject.Provider;

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList(
    nativeModules = {
      JSCHeapCapture.class,
    })
/* package */
public class DebugCorePackage extends BaseReactPackage implements ViewManagerOnDemandReactPackage {
  private @Nullable Map<String, ModuleSpec> mViewManagers;

  public DebugCorePackage() {}

  @Override
  public @Nullable NativeModule getModule(String name, ReactApplicationContext reactContext) {
    switch (name) {
      case JSCHeapCapture.NAME:
        return new JSCHeapCapture(reactContext);
      default:
        return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
      return fallbackForMissingClass();
    }
    try {
      Class<?> reactModuleInfoProviderClass =
          ClassFinder.findClass("com.facebook.react.DebugCorePackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      return fallbackForMissingClass();
    } catch (InstantiationException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for DebugCorePackage$$ReactModuleInfoProvider", e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
          "No ReactModuleInfoProvider for DebugCorePackage$$ReactModuleInfoProvider", e);
    }
  }

  private ReactModuleInfoProvider fallbackForMissingClass() {
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
              reactModule.isCxxModule(),
              ReactModuleInfo.classIsTurboModule(moduleClass)));
    }

    return () -> reactModuleInfoMap;
  }

  private static void appendMap(
      Map<String, ModuleSpec> map, String name, Provider<? extends NativeModule> provider) {
    map.put(name, ModuleSpec.viewManagerSpec(provider));
  }

  /**
   * @return a map of view managers that should be registered with {@link UIManagerModule}
   */
  private Map<String, ModuleSpec> getViewManagersMap() {
    if (mViewManagers == null) {
      Map<String, ModuleSpec> viewManagers = new HashMap<>();
      appendMap(viewManagers, DebuggingOverlayManager.REACT_CLASS, DebuggingOverlayManager::new);

      mViewManagers = viewManagers;
    }
    return mViewManagers;
  }

  @Override
  public List<ModuleSpec> getViewManagers(ReactApplicationContext reactContext) {
    return new ArrayList<>(getViewManagersMap().values());
  }

  @Override
  public Collection<String> getViewManagerNames(ReactApplicationContext reactContext) {
    return getViewManagersMap().keySet();
  }

  @Override
  public @Nullable ViewManager createViewManager(
      ReactApplicationContext reactContext, String viewManagerName) {
    ModuleSpec spec = getViewManagersMap().get(viewManagerName);
    return spec != null ? (ViewManager) spec.getProvider().get() : null;
  }
}
