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
import com.facebook.react.devsupport.JSCHeapCapture;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.traceupdateoverlay.TraceUpdateOverlayManager;
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
public class DebugCorePackage extends TurboReactPackage implements ViewManagerOnDemandReactPackage {
  private @Nullable Map<String, ModuleSpec> mViewManagers;

  public DebugCorePackage() {}

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    switch (name) {
      case JSCHeapCapture.NAME:
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

  private static void appendMap(
      Map<String, ModuleSpec> map, String name, Provider<? extends NativeModule> provider) {
    map.put(name, ModuleSpec.viewManagerSpec(provider));
  }

  /** @return a map of view managers that should be registered with {@link UIManagerModule} */
  private Map<String, ModuleSpec> getViewManagersMap(final ReactApplicationContext reactContext) {
    if (mViewManagers == null) {
      Map<String, ModuleSpec> viewManagers = new HashMap<>();
      appendMap(
          viewManagers,
          TraceUpdateOverlayManager.REACT_CLASS,
          new Provider<NativeModule>() {
            @Override
            public NativeModule get() {
              return new TraceUpdateOverlayManager();
            }
          });

      mViewManagers = viewManagers;
    }
    return mViewManagers;
  }

  @Override
  public List<ModuleSpec> getViewManagers(ReactApplicationContext reactContext) {
    return new ArrayList<>(getViewManagersMap(reactContext).values());
  }

  @Override
  public Collection<String> getViewManagerNames(ReactApplicationContext reactContext) {
    return getViewManagersMap(reactContext).keySet();
  }

  @Override
  public @Nullable ViewManager createViewManager(
      ReactApplicationContext reactContext, String viewManagerName) {
    ModuleSpec spec = getViewManagersMap(reactContext).get(viewManagerName);
    return spec != null ? (ViewManager) spec.getProvider().get() : null;
  }
}
