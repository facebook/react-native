/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.jni.HybridData;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags;
import com.facebook.react.internal.turbomodule.core.TurboModuleManagerDelegate;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.inject.Provider;

public abstract class ReactPackageTurboModuleManagerDelegate extends TurboModuleManagerDelegate {
  interface ModuleProvider {
    @Nullable
    NativeModule getModule(String moduleName);
  }

  private final List<ModuleProvider> mModuleProviders = new ArrayList<>();
  private final Map<ModuleProvider, Map<String, ReactModuleInfo>> mPackageModuleInfos =
      new HashMap<>();

  private final boolean mShouldEnableLegacyModuleInterop =
      ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()
          && ReactNativeNewArchitectureFeatureFlags.useTurboModuleInterop();

  // Lazy Props
  private List<ReactPackage> mPackages;
  private ReactApplicationContext mReactContext;

  protected ReactPackageTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    super();
    initialize(reactApplicationContext, packages);
  }

  protected ReactPackageTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext,
      List<ReactPackage> packages,
      HybridData hybridData) {
    super(hybridData);
    initialize(reactApplicationContext, packages);
  }

  private void initialize(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    final ReactApplicationContext applicationContext = reactApplicationContext;
    for (ReactPackage reactPackage : packages) {
      if (reactPackage instanceof BaseReactPackage) {
        final BaseReactPackage baseReactPackage = (BaseReactPackage) reactPackage;
        final ModuleProvider moduleProvider =
            moduleName -> baseReactPackage.getModule(moduleName, applicationContext);
        mModuleProviders.add(moduleProvider);
        mPackageModuleInfos.put(
            moduleProvider, baseReactPackage.getReactModuleInfoProvider().getReactModuleInfos());
        continue;
      }

      if (shouldSupportLegacyPackages() && reactPackage instanceof LazyReactPackage) {
        // TODO(T145105887): Output warnings that LazyReactPackage was used
        final LazyReactPackage lazyPkg = ((LazyReactPackage) reactPackage);
        final List<ModuleSpec> moduleSpecs = lazyPkg.getNativeModules(reactApplicationContext);
        final Map<String, Provider<? extends NativeModule>> moduleSpecProviderMap = new HashMap<>();
        for (final ModuleSpec moduleSpec : moduleSpecs) {
          moduleSpecProviderMap.put(moduleSpec.getName(), moduleSpec.getProvider());
        }

        final ModuleProvider moduleProvider =
            moduleName -> {
              Provider<? extends NativeModule> provider = moduleSpecProviderMap.get(moduleName);
              return provider != null ? provider.get() : null;
            };

        mModuleProviders.add(moduleProvider);
        mPackageModuleInfos.put(
            moduleProvider, lazyPkg.getReactModuleInfoProvider().getReactModuleInfos());
        continue;
      }

      if (shouldSupportLegacyPackages()) {
        // TODO(T145105887): Output warnings that ReactPackage was used
        final List<NativeModule> nativeModules =
            reactPackage.createNativeModules(reactApplicationContext);

        final Map<String, NativeModule> moduleMap = new HashMap<>();
        final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();

        for (final NativeModule module : nativeModules) {
          final Class<? extends NativeModule> moduleClass = module.getClass();
          final @Nullable ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);

          final String moduleName = reactModule != null ? reactModule.name() : module.getName();

          final ReactModuleInfo moduleInfo =
              reactModule != null
                  ? new ReactModuleInfo(
                      moduleName,
                      moduleClass.getName(),
                      reactModule.canOverrideExistingModule(),
                      true,
                      reactModule.isCxxModule(),
                      ReactModuleInfo.classIsTurboModule(moduleClass))
                  : new ReactModuleInfo(
                      moduleName,
                      moduleClass.getName(),
                      module.canOverrideExistingModule(),
                      true,
                      CxxModuleWrapper.class.isAssignableFrom(moduleClass),
                      ReactModuleInfo.classIsTurboModule(moduleClass));

          reactModuleInfoMap.put(moduleName, moduleInfo);
          moduleMap.put(moduleName, module);
        }

        final ModuleProvider moduleProvider = moduleMap::get;

        mModuleProviders.add(moduleProvider);
        mPackageModuleInfos.put(moduleProvider, reactModuleInfoMap);
      }
    }
  }

  @Override
  public boolean unstable_shouldEnableLegacyModuleInterop() {
    return mShouldEnableLegacyModuleInterop;
  }

  @Nullable
  @Override
  public TurboModule getModule(String moduleName) {
    NativeModule resolvedModule = null;

    for (final ModuleProvider moduleProvider : mModuleProviders) {
      final ReactModuleInfo moduleInfo = mPackageModuleInfos.get(moduleProvider).get(moduleName);
      if (moduleInfo != null
          && moduleInfo.isTurboModule()
          && (resolvedModule == null || moduleInfo.canOverrideExistingModule())) {

        final NativeModule module = moduleProvider.getModule(moduleName);
        if (module != null) {
          resolvedModule = module;
        }
      }
    }

    // Skip TurboModule-incompatible modules
    boolean isLegacyModule = !(resolvedModule instanceof TurboModule);
    if (isLegacyModule) {
      return null;
    }

    return (TurboModule) resolvedModule;
  }

  @Override
  public boolean unstable_isModuleRegistered(String moduleName) {
    for (final ModuleProvider moduleProvider : mModuleProviders) {
      final ReactModuleInfo moduleInfo = mPackageModuleInfos.get(moduleProvider).get(moduleName);
      if (moduleInfo != null && moduleInfo.isTurboModule()) {
        return true;
      }
    }
    return false;
  }

  @Override
  public boolean unstable_isLegacyModuleRegistered(String moduleName) {
    for (final ModuleProvider moduleProvider : mModuleProviders) {
      final ReactModuleInfo moduleInfo = mPackageModuleInfos.get(moduleProvider).get(moduleName);
      if (moduleInfo != null && !moduleInfo.isTurboModule()) {
        return true;
      }
    }
    return false;
  }

  @Nullable
  @Override
  public NativeModule getLegacyModule(String moduleName) {
    if (!unstable_shouldEnableLegacyModuleInterop()) {
      return null;
    }

    NativeModule resolvedModule = null;

    for (final ModuleProvider moduleProvider : mModuleProviders) {
      final ReactModuleInfo moduleInfo = mPackageModuleInfos.get(moduleProvider).get(moduleName);
      if (moduleInfo != null
          && !moduleInfo.isTurboModule()
          && (resolvedModule == null || moduleInfo.canOverrideExistingModule())) {

        final NativeModule module = moduleProvider.getModule(moduleName);
        if (module != null) {
          resolvedModule = module;
        }
      }
    }

    // Skip TurboModule-compatible modules
    boolean isLegacyModule = !(resolvedModule instanceof TurboModule);
    if (!isLegacyModule) {
      return null;
    }

    return resolvedModule;
  }

  @Override
  public List<String> getEagerInitModuleNames() {
    List<String> moduleNames = new ArrayList<>();
    for (final ModuleProvider moduleProvider : mModuleProviders) {
      for (final ReactModuleInfo moduleInfo : mPackageModuleInfos.get(moduleProvider).values()) {
        if (moduleInfo.isTurboModule() && moduleInfo.needsEagerInit()) {
          moduleNames.add(moduleInfo.name());
        }
      }
    }
    return moduleNames;
  }

  private boolean shouldSupportLegacyPackages() {
    return unstable_shouldEnableLegacyModuleInterop();
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
          "The ReactApplicationContext must be provided to create"
              + " ReactPackageTurboModuleManagerDelegate");
      Assertions.assertNotNull(
          mPackages,
          "A set of ReactPackages must be provided to create"
              + " ReactPackageTurboModuleManagerDelegate");
      return build(mContext, mPackages);
    }
  }
}
