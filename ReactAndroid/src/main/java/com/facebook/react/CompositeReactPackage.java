/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

/**
 * {@code CompositeReactPackage} allows to create a single package composed of views and modules
 * from several other packages.
 */
public class CompositeReactPackage implements ViewManagerOnDemandReactPackage, ReactPackage {

  private final List<ReactPackage> mChildReactPackages = new ArrayList<>();

  /**
   * The order in which packages are passed matters. It may happen that a NativeModule or or a
   * ViewManager exists in two or more ReactPackages. In that case the latter will win i.e. the
   * latter will overwrite the former. This re-occurrence is detected by comparing a name of a
   * module.
   */
  public CompositeReactPackage(ReactPackage arg1, ReactPackage arg2, ReactPackage... args) {
    mChildReactPackages.add(arg1);
    mChildReactPackages.add(arg2);

    Collections.addAll(mChildReactPackages, args);
  }

  /** {@inheritDoc} */
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    // This is for backward compatibility.
    final Map<String, NativeModule> moduleMap = new HashMap<>();
    for (ReactPackage reactPackage : mChildReactPackages) {
      for (NativeModule nativeModule : reactPackage.createNativeModules(reactContext)) {
        moduleMap.put(nativeModule.getName(), nativeModule);
      }
    }
    return new ArrayList<>(moduleMap.values());
  }

  /** {@inheritDoc} */
  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    final Map<String, ViewManager> viewManagerMap = new HashMap<>();
    for (ReactPackage reactPackage : mChildReactPackages) {
      for (ViewManager viewManager : reactPackage.createViewManagers(reactContext)) {
        viewManagerMap.put(viewManager.getName(), viewManager);
      }
    }
    return new ArrayList<>(viewManagerMap.values());
  }

  /** {@inheritDoc} */
  @Override
  public List<String> getViewManagerNames(ReactApplicationContext reactContext) {
    Set<String> uniqueNames = new HashSet<>();
    for (ReactPackage reactPackage : mChildReactPackages) {
      if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
        List<String> names =
            ((ViewManagerOnDemandReactPackage) reactPackage).getViewManagerNames(reactContext);
        if (names != null) {
          uniqueNames.addAll(names);
        }
      }
    }
    return new ArrayList<>(uniqueNames);
  }

  /** {@inheritDoc} */
  @Override
  public @Nullable ViewManager createViewManager(
      ReactApplicationContext reactContext, String viewManagerName) {
    ListIterator<ReactPackage> iterator =
        mChildReactPackages.listIterator(mChildReactPackages.size());
    while (iterator.hasPrevious()) {
      ReactPackage reactPackage = iterator.previous();
      if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
        ViewManager viewManager =
            ((ViewManagerOnDemandReactPackage) reactPackage)
                .createViewManager(reactContext, viewManagerName);
        if (viewManager != null) {
          return viewManager;
        }
      }
    }
    return null;
  }
}
