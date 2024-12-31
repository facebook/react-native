/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.turbomodule.core;

import androidx.annotation.GuardedBy;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.internal.turbomodule.core.interfaces.TurboModuleRegistry;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.NativeMethodCallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * This is the main class and entry point for TurboModules. Note that this is a hybrid class, and
 * has a C++ counterpart This class installs the JSI bindings. It also implements the method to get
 * a Java module, that the C++ counterpart calls.
 */
public class TurboModuleManager implements TurboModuleRegistry {
  private static final String TAG = "TurboModuleManager";

  private final List<String> mEagerInitModuleNames;
  private final ModuleProvider mTurboModuleProvider;
  private final ModuleProvider mLegacyModuleProvider;
  private final TurboModuleManagerDelegate mDelegate;

  static {
    NativeModuleSoLoader.maybeLoadSoLibrary();
  }

  // Prevents the creation of new TurboModules once cleanup as been initiated.
  private final Object mModuleCleanupLock = new Object();

  @GuardedBy("mModuleCleanupLock")
  private boolean mModuleCleanupStarted = false;

  // List of TurboModules that have been, or are currently being, instantiated
  @GuardedBy("mModuleCleanupLock")
  private final Map<String, ModuleHolder> mModuleHolders = new HashMap<>();

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public TurboModuleManager(
      RuntimeExecutor runtimeExecutor,
      @Nullable final TurboModuleManagerDelegate delegate,
      CallInvokerHolder jsCallInvokerHolder,
      NativeMethodCallInvokerHolder nativeMethodCallInvokerHolder) {
    mDelegate = delegate;
    mHybridData =
        initHybrid(
            runtimeExecutor,
            (CallInvokerHolderImpl) jsCallInvokerHolder,
            (NativeMethodCallInvokerHolderImpl) nativeMethodCallInvokerHolder,
            delegate);
    installJSIBindings(shouldEnableLegacyModuleInterop());

    mEagerInitModuleNames =
        delegate == null ? Collections.emptyList() : delegate.getEagerInitModuleNames();

    ModuleProvider nullProvider = moduleName -> null;

    mTurboModuleProvider =
        delegate == null
            ? nullProvider
            : moduleName -> (NativeModule) delegate.getModule(moduleName);

    mLegacyModuleProvider =
        delegate == null || !shouldEnableLegacyModuleInterop()
            ? nullProvider
            : moduleName -> {
              NativeModule nativeModule = delegate.getLegacyModule(moduleName);
              if (nativeModule != null) {
                // TurboModuleManagerDelegate.getLegacyModule must never return a TurboModule
                Assertions.assertCondition(
                    !(nativeModule instanceof TurboModule),
                    "NativeModule \"" + moduleName + "\" is a TurboModule");
                return nativeModule;
              }
              return null;
            };
  }

  private boolean isTurboModule(String moduleName) {
    return mDelegate != null && mDelegate.unstable_isModuleRegistered(moduleName);
  }

  private boolean isLegacyModule(String moduleName) {
    return mDelegate != null && mDelegate.unstable_isLegacyModuleRegistered(moduleName);
  }

  private boolean shouldEnableLegacyModuleInterop() {
    return mDelegate != null && mDelegate.unstable_shouldEnableLegacyModuleInterop();
  }

  @Override
  @NonNull
  public List<String> getEagerInitModuleNames() {
    return mEagerInitModuleNames;
  }

  // used from TurboModuleManager.cpp
  @SuppressWarnings("unused")
  @DoNotStrip
  private static List<TurboModuleInteropUtils.MethodDescriptor> getMethodDescriptorsFromModule(
      NativeModule module) {
    return TurboModuleInteropUtils.getMethodDescriptorsFromModule(module);
  }

  // used from TurboModuleManager.cpp
  @SuppressWarnings("unused")
  @DoNotStrip
  @Nullable
  private NativeModule getLegacyJavaModule(String moduleName) {
    /*
     * This API is invoked from global.nativeModuleProxy.
     * Only call getModule if the native module is a legacy module.
     */
    if (!isLegacyModule(moduleName)) {
      return null;
    }

    final NativeModule module = getModule(moduleName);
    return !(module instanceof CxxModuleWrapper) && !(module instanceof TurboModule)
        ? module
        : null;
  }

  // used from TurboModuleManager.cpp
  @SuppressWarnings("unused")
  @DoNotStrip
  @Nullable
  private CxxModuleWrapper getLegacyCxxModule(String moduleName) {
    /*
     * This API is invoked from global.nativeModuleProxy.
     * Only call getModule if the native module is a legacy module.
     */
    if (!isLegacyModule(moduleName)) {
      return null;
    }

    final NativeModule module = getModule(moduleName);
    return module instanceof CxxModuleWrapper && !(module instanceof TurboModule)
        ? (CxxModuleWrapper) module
        : null;
  }

  // used from TurboModuleManager.cpp
  @SuppressWarnings("unused")
  @DoNotStrip
  @Nullable
  private CxxModuleWrapper getTurboLegacyCxxModule(String moduleName) {
    /*
     * This API is invoked from global.__turboModuleProxy.
     * Only call getModule if the native module is a turbo module.
     */
    if (!isTurboModule(moduleName)) {
      return null;
    }

    final NativeModule module = getModule(moduleName);
    return module instanceof CxxModuleWrapper && module instanceof TurboModule
        ? (CxxModuleWrapper) module
        : null;
  }

  // used from TurboModuleManager.cpp
  @SuppressWarnings("unused")
  @DoNotStrip
  @Nullable
  private TurboModule getTurboJavaModule(String moduleName) {
    /*
     * This API is invoked from global.__turboModuleProxy.
     * Only call getModule if the native module is a turbo module.
     */
    if (!isTurboModule(moduleName)) {
      return null;
    }

    final NativeModule module = getModule(moduleName);
    return !(module instanceof CxxModuleWrapper) && module instanceof TurboModule
        ? (TurboModule) module
        : null;
  }

  /**
   * Return the NativeModule instance that corresponds to the provided moduleName.
   *
   * <p>This method: - Creates and initializes the module if it doesn't already exist. - Returns
   * null after TurboModuleManager has been torn down.
   */
  @Nullable
  public NativeModule getModule(String moduleName) {
    ModuleHolder moduleHolder;

    synchronized (mModuleCleanupLock) {
      if (mModuleCleanupStarted) {
        /*
         * Always return null after cleanup has started, so that getNativeModule(moduleName) returns null.
         */
        FLog.e(
            TAG,
            "getModule(): Tried to get module \"%s\", but TurboModuleManager was tearing down"
                + " (legacy: %b, turbo: %b)",
            moduleName,
            isLegacyModule(moduleName),
            isTurboModule(moduleName));
        return null;
      }

      /*
       * TODO(T64619790): Should we populate mModuleHolders ahead of time, to avoid having
       * * to control concurrent access to it?
       */
      if (!mModuleHolders.containsKey(moduleName)) {
        mModuleHolders.put(moduleName, new ModuleHolder());
      }

      moduleHolder = mModuleHolders.get(moduleName);
    }

    TurboModulePerfLogger.moduleCreateStart(moduleName, moduleHolder.getModuleId());
    NativeModule module = getOrCreateModule(moduleName, moduleHolder, true);

    if (module != null) {
      TurboModulePerfLogger.moduleCreateEnd(moduleName, moduleHolder.getModuleId());
    } else {
      TurboModulePerfLogger.moduleCreateFail(moduleName, moduleHolder.getModuleId());
    }

    return module;
  }

  /**
   * Given a ModuleHolder, and the TurboModule's moduleName, return the TurboModule instance.
   *
   * <p>Use the ModuleHolder to ensure that if n threads race to create TurboModule x, then only the
   * first thread creates x. All n - 1 other threads wait until the x is created and initialized.
   */
  @Nullable
  private NativeModule getOrCreateModule(
      String moduleName, @NonNull ModuleHolder moduleHolder, boolean shouldPerfLog) {
    boolean shouldCreateModule = false;

    synchronized (moduleHolder) {
      if (moduleHolder.isDoneCreatingModule()) {
        if (shouldPerfLog) {
          TurboModulePerfLogger.moduleCreateCacheHit(moduleName, moduleHolder.getModuleId());
        }

        return moduleHolder.getModule();
      }

      if (!moduleHolder.isCreatingModule()) {
        // Only one thread gets here
        shouldCreateModule = true;
        moduleHolder.startCreatingModule();
      }
    }

    if (shouldCreateModule) {
      TurboModulePerfLogger.moduleCreateConstructStart(moduleName, moduleHolder.getModuleId());
      NativeModule nativeModule = mTurboModuleProvider.getModule(moduleName);

      if (nativeModule == null) {
        nativeModule = mLegacyModuleProvider.getModule(moduleName);
      }

      TurboModulePerfLogger.moduleCreateConstructEnd(moduleName, moduleHolder.getModuleId());
      TurboModulePerfLogger.moduleCreateSetUpStart(moduleName, moduleHolder.getModuleId());

      if (nativeModule != null) {
        synchronized (moduleHolder) {
          moduleHolder.setModule(nativeModule);
        }

        /*
         * TurboModuleManager is initialized after ReactApplicationContext has been set up.
         * NativeModules should be initialized after ReactApplicationContext has been set up.
         * Therefore, we should initialize on the TurboModule now.
         */
        nativeModule.initialize();
      } else {
        FLog.e(
            TAG,
            "getOrCreateModule(): Unable to create module \"%s\" (legacy: %b, turbo: %b)",
            moduleName,
            isLegacyModule(moduleName),
            isTurboModule(moduleName));
      }

      TurboModulePerfLogger.moduleCreateSetUpEnd(moduleName, moduleHolder.getModuleId());
      synchronized (moduleHolder) {
        moduleHolder.endCreatingModule();
        moduleHolder.notifyAll();
      }

      return nativeModule;
    }

    synchronized (moduleHolder) {
      boolean wasInterrupted = false;
      while (moduleHolder.isCreatingModule()) {
        try {
          // Wait until TurboModule is created and initialized
          moduleHolder.wait();
        } catch (InterruptedException e) {
          wasInterrupted = true;
        }
      }

      if (wasInterrupted) {
        /*
         * TurboModules should ideally be quick to create and initialize. Therefore,
         * we wait until the TurboModule is done initializing before re-interrupting the
         * current thread.
         */
        Thread.currentThread().interrupt();
      }

      return moduleHolder.getModule();
    }
  }

  /** Which NativeModules have been created? */
  public Collection<NativeModule> getModules() {
    final List<ModuleHolder> moduleHolders = new ArrayList<>();
    synchronized (mModuleCleanupLock) {
      moduleHolders.addAll(mModuleHolders.values());
    }

    final List<NativeModule> modules = new ArrayList<>();
    for (final ModuleHolder moduleHolder : moduleHolders) {
      synchronized (moduleHolder) {
        // No need to wait for the TurboModule to finish being created and initialized
        if (moduleHolder.getModule() != null) {
          modules.add(moduleHolder.getModule());
        }
      }
    }

    return modules;
  }

  public boolean hasModule(String moduleName) {
    ModuleHolder moduleHolder;
    synchronized (mModuleCleanupLock) {
      moduleHolder = mModuleHolders.get(moduleName);
    }

    if (moduleHolder != null) {
      synchronized (moduleHolder) {
        if (moduleHolder.getModule() != null) {
          return true;
        }
      }
    }

    return false;
  }

  private native HybridData initHybrid(
      RuntimeExecutor runtimeExecutor,
      CallInvokerHolderImpl jsCallInvokerHolder,
      NativeMethodCallInvokerHolderImpl nativeMethodCallInvoker,
      TurboModuleManagerDelegate tmmDelegate);

  private native void installJSIBindings(boolean shouldCreateLegacyModules);

  @Override
  public void invalidate() {
    /*
     * Halt the production of new TurboModules.
     *
     * <p>After this point, mModuleHolders will not be accessed by TurboModuleManager.
     * Therefore, it won't be modified.
     *
     * <p>The ModuleHolders in mModuleHolders, however, can still be populated with newly
     * created TurboModules.
     */
    synchronized (mModuleCleanupLock) {
      mModuleCleanupStarted = true;
    }

    for (final Map.Entry<String, ModuleHolder> moduleHolderEntry : mModuleHolders.entrySet()) {
      final String moduleName = moduleHolderEntry.getKey();
      final ModuleHolder moduleHolder = moduleHolderEntry.getValue();

      /**
       * ReactNative could start tearing down before this particular TurboModule has been fully
       * initialized. In this case, we should wait for initialization to complete, before destroying
       * the TurboModule.
       */
      final NativeModule nativeModule = getOrCreateModule(moduleName, moduleHolder, false);

      if (nativeModule != null) {
        nativeModule.invalidate();
      }
    }

    mModuleHolders.clear();

    // Delete the native part of this hybrid class.
    mHybridData.resetNative();
  }

  private static class ModuleHolder {
    private volatile NativeModule mModule = null;
    private volatile boolean mIsTryingToCreate = false;
    private volatile boolean mIsDoneCreatingModule = false;
    private static volatile int sHolderCount = 0;
    private volatile int mModuleId;

    public ModuleHolder() {
      mModuleId = sHolderCount;
      sHolderCount += 1;
    }

    int getModuleId() {
      return mModuleId;
    }

    void setModule(@NonNull NativeModule module) {
      mModule = module;
    }

    @Nullable
    NativeModule getModule() {
      return mModule;
    }

    void startCreatingModule() {
      mIsTryingToCreate = true;
    }

    void endCreatingModule() {
      mIsTryingToCreate = false;
      mIsDoneCreatingModule = true;
    }

    boolean isDoneCreatingModule() {
      return mIsDoneCreatingModule;
    }

    boolean isCreatingModule() {
      return mIsTryingToCreate;
    }
  }

  private interface ModuleProvider {
    @Nullable
    NativeModule getModule(String name);
  }
}
