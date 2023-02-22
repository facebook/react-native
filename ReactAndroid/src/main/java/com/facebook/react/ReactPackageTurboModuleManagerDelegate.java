/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public abstract class ReactPackageTurboModuleManagerDelegate extends TurboModuleManagerDelegate {
  private final List<TurboReactPackage> mPackages = new ArrayList<>();
  private final Map<TurboReactPackage, Map<String, ReactModuleInfo>> mPackageModuleInfos =
      new HashMap<>();
  private final ReactApplicationContext mReactApplicationContext;

  protected ReactPackageTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    super();
    mReactApplicationContext = reactApplicationContext;
    for (ReactPackage reactPackage : packages) {
      if (reactPackage instanceof TurboReactPackage) {
        TurboReactPackage pkg = (TurboReactPackage) reactPackage;
        mPackages.add(pkg);
        mPackageModuleInfos.put(pkg, pkg.getReactModuleInfoProvider().getReactModuleInfos());
      }
    }
  }

  @Nullable
  @Override
  public TurboModule getModule(String moduleName) {
    TurboModule module = resolveModule(moduleName);
    if (module == null) {
      return null;
    }

    if (module instanceof CxxModuleWrapper) {
      return null;
    }

    return module;
  }

  @Nullable
  @Override
  @DoNotStrip
  public CxxModuleWrapper getLegacyCxxModule(String moduleName) {
    TurboModule module = resolveModule(moduleName);
    if (module == null) {
      return null;
    }

    if (!(module instanceof CxxModuleWrapper)) {
      return null;
    }

    return (CxxModuleWrapper) module;
  }

  @Nullable
  private TurboModule resolveModule(String moduleName) {
    NativeModule resolvedModule = null;

    for (final TurboReactPackage pkg : mPackages) {
      try {
        final ReactModuleInfo moduleInfo = mPackageModuleInfos.get(pkg).get(moduleName);
        if (moduleInfo == null
            || !moduleInfo.isTurboModule()
            || resolvedModule != null && !moduleInfo.canOverrideExistingModule()) {
          continue;
        }

        final NativeModule module = pkg.getModule(moduleName, mReactApplicationContext);
        if (module != null) {
          resolvedModule = module;
        }
      } catch (IllegalArgumentException ex) {
        /**
         * TurboReactPackages can throw an IllegalArgumentException when a module isn't found. If
         * this happens, it's safe to ignore the exception because a later TurboReactPackage could
         * provide the module.
         */
      }
    }

    if (resolvedModule instanceof TurboModule) {
      return (TurboModule) resolvedModule;
    }

    return null;
  }

  @Override
  public List<String> getEagerInitModuleNames() {
    List<String> moduleNames = new ArrayList<>();
    for (TurboReactPackage reactPackage : mPackages) {
      for (ReactModuleInfo moduleInfo :
          reactPackage.getReactModuleInfoProvider().getReactModuleInfos().values()) {

        if (moduleInfo.isTurboModule() && moduleInfo.needsEagerInit()) {
          moduleNames.add(moduleInfo.name());
        }
      }
    }
    return moduleNames;
  }

  public abstract static class Builder {
    private @Nullable List<ReactPackage> mPackages;
    private @Nullable ReactApplicationContext mContext;

    public Builder setPackages(List<ReactPackage> packages) {
      mPackages = new ArrayList<>(packages);
      return this;
    }

    public Builder setReactApplicationContext(ReactApplicationContext context) {
      mContext = context;
      return this;
    }

    protected abstract ReactPackageTurboModuleManagerDelegate build(
        ReactApplicationContext context, List<ReactPackage> packages);

    public ReactPackageTurboModuleManagerDelegate build() {
      Assertions.assertNotNull(
          mContext,
          "The ReactApplicationContext must be provided to create ReactPackageTurboModuleManagerDelegate");
      Assertions.assertNotNull(
          mPackages,
          "A set of ReactPackages must be provided to create ReactPackageTurboModuleManagerDelegate");
      return build(mContext, mPackages);
    }
  }
}
