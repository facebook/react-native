/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeModule;
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
  private final TurboModuleProvider mJavaModuleProvider;
  private final TurboModuleProvider mCxxModuleProvider;

  // Prevents the creation of new TurboModules once cleanup as been initiated.
  private final Object mTurboModuleCleanupLock = new Object();

  @GuardedBy("mTurboModuleCleanupLock")
  private boolean mTurboModuleCleanupStarted = false;

  // List of TurboModules that have been, or are currently being, instantiated
  @GuardedBy("mTurboModuleCleanupLock")
  private final Map<String, TurboModuleHolder> mTurboModuleHolders = new HashMap<>();

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public TurboModuleManager(
      JavaScriptContextHolder jsContext,
      @Nullable final TurboModuleManagerDelegate delegate,
      CallInvokerHolder jsCallInvokerHolder,
      CallInvokerHolder nativeCallInvokerHolder) {
    maybeLoadSoLibrary();
    mHybridData =
        initHybrid(
            jsContext.get(),
            (CallInvokerHolderImpl) jsCallInvokerHolder,
            (CallInvokerHolderImpl) nativeCallInvokerHolder,
            delegate);
    installJSIBindings();

    mEagerInitModuleNames =
        delegate == null ? new ArrayList<String>() : delegate.getEagerInitModuleNames();

    mJavaModuleProvider =
        new TurboModuleProvider() {
          @Nullable
          public TurboModule getModule(String moduleName) {
            if (delegate == null) {
              return null;
            }

            return delegate.getModule(moduleName);
          }
        };

    mCxxModuleProvider =
        new TurboModuleProvider() {
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

  /**
   * TurboModuleHolders are used as locks to ensure that when n threads race to create a
   * TurboModule, only the first thread creates that TurboModule. All other n - 1 threads wait until
   * the TurboModule is created and initialized.
   */
  @Nullable
  private TurboModuleHolder getOrMaybeCreateTurboModuleHolder(String moduleName) {
    synchronized (mTurboModuleCleanupLock) {
      if (mTurboModuleCleanupStarted) {
        /*
         * Always return null after cleanup has started, so that getModule(moduleName) returns null.
         */
        return null;
      }

      /*
       * TODO(T64619790): Should we populate mJavaTurboModuleHolders ahead of time, to avoid having
       * * to control concurrent access to it?
       */
      if (!mTurboModuleHolders.containsKey(moduleName)) {
        mTurboModuleHolders.put(moduleName, new TurboModuleHolder());
      }
      return mTurboModuleHolders.get(moduleName);
    }
  }

  /**
   * If n threads race to create TurboModule x, then only the first thread should create x. All n -
   * 1 other threads should wait until x is created and initialized.
   *
   * <p>Note: After we've started cleanup, getModule will always return null.
   */
  @Nullable
  public TurboModule getModule(String moduleName) {
    final TurboModuleHolder moduleHolder = getOrMaybeCreateTurboModuleHolder(moduleName);

    if (moduleHolder == null) {
      return null;
    }

    boolean shouldCreateModule = false;

    synchronized (moduleHolder) {
      if (moduleHolder.isDoneCreatingModule()) {
        return moduleHolder.getModule();
      }

      if (!moduleHolder.isCreatingModule()) {
        // Only one thread gets here
        shouldCreateModule = true;
        moduleHolder.startCreatingModule();
      }
    }

    if (shouldCreateModule) {
      TurboModule turboModule = mJavaModuleProvider.getModule(moduleName);

      if (turboModule == null) {
        turboModule = mCxxModuleProvider.getModule(moduleName);
      }

      if (turboModule != null) {
        synchronized (moduleHolder) {
          moduleHolder.setModule(turboModule);
        }

        /*
         * TurboModuleManager is initialized after ReactApplicationContext has been set up.
         * NativeModules should be initialized after ReactApplicationContext has been set up.
         * Therefore, we should initialize on the TurboModule now.
         */
        ((NativeModule) turboModule).initialize();
      }

      synchronized (moduleHolder) {
        moduleHolder.endCreatingModule();
        moduleHolder.notifyAll();
      }

      return turboModule;
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

  /** Which TurboModules have been created? */
  public Collection<TurboModule> getModules() {
    final List<TurboModuleHolder> turboModuleHolders = new ArrayList<>();
    synchronized (mTurboModuleCleanupLock) {
      turboModuleHolders.addAll(mTurboModuleHolders.values());
    }

    final List<TurboModule> turboModules = new ArrayList<>();
    for (final TurboModuleHolder moduleHolder : turboModuleHolders) {
      synchronized (moduleHolder) {
        // No need to wait for the TurboModule to finish being created and initialized
        if (moduleHolder.getModule() != null) {
          turboModules.add(moduleHolder.getModule());
        }
      }
    }

    return turboModules;
  }

  public boolean hasModule(String moduleName) {
    TurboModuleHolder moduleHolder;
    synchronized (mTurboModuleCleanupLock) {
      moduleHolder = mTurboModuleHolders.get(moduleName);
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
      long jsContext,
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
     * <p>After this point, mTurboModuleHolders will not be accessed by TurboModuleManager.
     * Therefore, it won't be modified.
     *
     * <p>The TurboModuleHolders in mTurboModuleHolders, however, can still be populated with newly
     * created TurboModules.
     */
    synchronized (mTurboModuleCleanupLock) {
      mTurboModuleCleanupStarted = true;
    }

    final Set<String> turboModuleNames = new HashSet<>(mTurboModuleHolders.keySet());

    for (final String moduleName : turboModuleNames) {
      // Retrieve the TurboModule, possibly waiting for it to finish instantiating.
      final TurboModule turboModule = getModule(moduleName);

      if (turboModule != null) {
        // TODO(T48014458): Rename this to invalidate()
        ((NativeModule) turboModule).onCatalystInstanceDestroy();
      }
    }

    mTurboModuleHolders.clear();

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

  private static class TurboModuleHolder {
    private volatile TurboModule mModule = null;
    private volatile boolean mIsTryingToCreate = false;
    private volatile boolean mIsDoneCreatingModule = false;

    void setModule(@NonNull TurboModule module) {
      mModule = module;
    }

    @Nullable
    TurboModule getModule() {
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

  private interface TurboModuleProvider {
    @Nullable
    TurboModule getModule(String name);
  }
}
