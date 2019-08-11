// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.turbomodule.core;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.ReactPackage;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public abstract class ReactPackageTurboModuleManagerDelegate extends TurboModuleManagerDelegate {
  private final List<TurboReactPackage> mPackages = new ArrayList<>();
  private final Map<String, TurboModule> mModules = new HashMap<>();
  private final ReactApplicationContext mReactApplicationContext;

  protected ReactPackageTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    super();
    mReactApplicationContext = reactApplicationContext;
    for (ReactPackage reactPackage : packages) {
      if (reactPackage instanceof TurboReactPackage) {
        mPackages.add((TurboReactPackage) reactPackage);
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

  private TurboModule resolveModule(String moduleName) {
    if (mModules.containsKey(moduleName)) {
      return mModules.get(moduleName);
    }

    NativeModule resolvedModule = null;

    for (final TurboReactPackage pkg : mPackages) {
      try {
        NativeModule module = pkg.getModule(moduleName, mReactApplicationContext);
        if (resolvedModule == null || module != null && module.canOverrideExistingModule()) {
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
      mModules.put(moduleName, (TurboModule) resolvedModule);
    } else {
      /**
       * 1. The list of TurboReactPackages doesn't change. 2. TurboReactPackage.getModule is
       * deterministic. Therefore, any two invocations of TurboReactPackage.getModule will return
       * the same result given that they're provided the same arguments.
       *
       * <p>Hence, if module lookup fails once, we know it'll fail every time. Therefore, we can
       * write null to the mModules Map and avoid doing this extra work.
       */
      mModules.put(moduleName, null);
    }

    return mModules.get(moduleName);
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
