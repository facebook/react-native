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
import com.facebook.react.module.annotations.ReactModuleList;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.debuggingoverlay.DebuggingOverlayManager;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Package defining core framework modules (e.g. UIManager). It should be used for modules that
 * require special integration with other framework parts (e.g. with the list of packages to load
 * view managers from).
 */
@ReactModuleList(nativeModules = {})
/* package */
public class DebugCorePackage extends BaseReactPackage implements ViewManagerOnDemandReactPackage {
  private @Nullable Map<String, ModuleSpec> mViewManagers;

  public DebugCorePackage() {}

  @Override
  public @Nullable NativeModule getModule(String name, ReactApplicationContext reactContext) {
    return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new ReactModuleInfoProvider() {
      @Override
      public Map<String, ReactModuleInfo> getReactModuleInfos() {
        return Collections.emptyMap();
      }
    };
  }

  /**
   * @return a map of view managers that should be registered with {@link UIManagerModule}
   */
  private Map<String, ModuleSpec> getViewManagersMap() {
    if (mViewManagers == null) {
      Map<String, ModuleSpec> viewManagers = new HashMap<>();
      viewManagers.put(
          DebuggingOverlayManager.REACT_CLASS,
          ModuleSpec.viewManagerSpec(DebuggingOverlayManager::new));
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
