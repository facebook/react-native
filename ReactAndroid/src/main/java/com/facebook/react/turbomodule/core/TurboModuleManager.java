/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import androidx.annotation.GuardedBy;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.bridge.JSIModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.react.turbomodule.core.interfaces.TurboModuleRegistry;
import com.facebook.soloader.SoLoader;
import java.util.*;

/**
 * This is the main class and entry point for TurboModules. Note that this is a hybrid class, and
 * has a C++ counterpart This class installs the JSI bindings. It also implements the method to get
 * a Java module, that the C++ counterpart calls.
 */
public class TurboModuleManager implements JSIModule, TurboModuleRegistry {
  private static volatile boolean sIsSoLibraryLoaded;
  private final List<String> mEagerInitModuleNames;
  private final ModuleProvider<TurboModule> mJavaModuleProvider;
  private final ModuleProvider<TurboModule> mCxxModuleProvider;

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
      CallInvokerHolder nativeCallInvokerHolder) {
    maybeLoadSoLibrary();
    mHybridData =
        initHybrid(
            runtimeExecutor,
            (CallInvokerHolderImpl) jsCallInvokerHolder,
            (CallInvokerHolderImpl) nativeCallInvokerHolder,
            delegate);
    installJSIBindings();

    mEagerInitModuleNames =
        delegate == null ? new ArrayList<String>() : delegate.getEagerInitModuleNames();

    mJavaModuleProvider =
        new ModuleProvider<TurboModule>() {
          @Nullable
          public TurboModule getModule(String moduleName) {
            if (delegate == null) {
              return null;
            }

            return delegate.getModule(moduleName);
          }
        };

    mCxxModuleProvider =
        new ModuleProvider<TurboModule>() {
          @Nullable
          public TurboModule getModule(String moduleName) {
            if (delegate == null) {
              return null;
            }

            CxxModuleWrapper nativeModule = delegate.getLegacyCxxModule(moduleName);
            if (nativeModule != null) {
              // TurboModuleManagerDelegate must always return TurboModules
              Assertions.assertCondition(
                  nativeModule instanceof TurboModule,
                  "CxxModuleWrapper \"" + moduleName + "\" is not a TurboModule");
              return (TurboModule) nativeModule;
            }
            return null;
          }
        };
  }

  public List<String> getEagerInitModuleNames() {
    return mEagerInitModuleNames;
  }

  @DoNotStrip
  @Nullable
  private CxxModuleWrapper getLegacyCxxModule(String moduleName) {
    final TurboModule turboModule = getModule(moduleName);
    if (!(turboModule instanceof CxxModuleWrapper)) {
      return null;
    }

    return (CxxModuleWrapper) turboModule;
  }

  @DoNotStrip
  @Nullable
  private TurboModule getJavaModule(String moduleName) {
    final TurboModule turboModule = getModule(moduleName);
    if (turboModule instanceof CxxModuleWrapper) {
      return null;
    }

    return turboModule;
  }

  /**
   * Return the TurboModule instance that corresponds to the provided moduleName.
   *
   * <p>This method: - Creates and initializes the module if it doesn't already exist. - Returns
   * null after TurboModuleManager has been torn down.
   */
  @Nullable
  public TurboModule getModule(String moduleName) {
    ModuleHolder moduleHolder;

    synchronized (mModuleCleanupLock) {
      if (mModuleCleanupStarted) {
        /*
         * Always return null after cleanup has started, so that getModule(moduleName) returns null.
         */
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
    TurboModule module = (TurboModule) getOrCreateModule(moduleName, moduleHolder, true);

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
      NativeModule nativeModule = (NativeModule) mJavaModuleProvider.getModule(moduleName);

      if (nativeModule == null) {
        nativeModule = (NativeModule) mCxxModuleProvider.getModule(moduleName);
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

  /** Which TurboModules have been created? */
  public Collection<TurboModule> getModules() {
    final List<ModuleHolder> moduleHolders = new ArrayList<>();
    synchronized (mModuleCleanupLock) {
      moduleHolders.addAll(mModuleHolders.values());
    }

    final List<TurboModule> turboModules = new ArrayList<>();
    for (final ModuleHolder moduleHolder : moduleHolders) {
      synchronized (moduleHolder) {
        // No need to wait for the TurboModule to finish being created and initialized
        if (moduleHolder.getModule() != null) {
          turboModules.add((TurboModule) moduleHolder.getModule());
        }
      }
    }

    return turboModules;
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
      CallInvokerHolderImpl nativeCallInvokerHolder,
      TurboModuleManagerDelegate tmmDelegate);

  private native void installJSIBindings();

  @Override
  public void initialize() {}

  @Override
  public void onCatalystInstanceDestroy() {
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

  // Prevents issues with initializer interruptions. See T38996825 and D13793825 for more context.
  private static synchronized void maybeLoadSoLibrary() {
    if (!sIsSoLibraryLoaded) {
      SoLoader.loadLibrary("turbomodulejsijni");
      sIsSoLibraryLoaded = true;
    }
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

  private interface ModuleProvider<T> {
    @Nullable
    T getModule(String name);
  }
}
