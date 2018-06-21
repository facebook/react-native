// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import static com.facebook.infer.annotation.Assertions.assertNotNull;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_MODULE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_MODULE_START;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.systrace.SystraceMessage;
import java.util.concurrent.atomic.AtomicInteger;
import javax.annotation.Nullable;
import javax.annotation.concurrent.GuardedBy;
import javax.inject.Provider;

/**
 * Holder to enable us to lazy create native modules.
 *
 * This works by taking a provider instead of an instance, when it is first required we'll create
 * and initialize it. Initialization currently always happens on the UI thread but this is due to
 * change for performance reasons.
 *
 * Lifecycle events via a {@link LifecycleEventListener} will still always happen on the UI thread.
 */
@DoNotStrip
public class ModuleHolder {

  private static final AtomicInteger sInstanceKeyCounter = new AtomicInteger(1);

  private final int mInstanceKey = sInstanceKeyCounter.getAndIncrement();

  private final String mName;
  private final boolean mCanOverrideExistingModule;
  private final boolean mHasConstants;

  private @Nullable Provider<? extends NativeModule> mProvider;
  // Outside of the constructur, these should only be checked or set when synchronized on this
  private @Nullable @GuardedBy("this") NativeModule mModule;

  // These are used to communicate phases of creation and initialization across threads
  private @GuardedBy("this") boolean mInitializable;
  private @GuardedBy("this") boolean mIsCreating;
  private @GuardedBy("this") boolean mIsInitializing;

  public ModuleHolder(ReactModuleInfo moduleInfo, Provider<? extends NativeModule> provider) {
    mName = moduleInfo.name();
    mCanOverrideExistingModule = moduleInfo.canOverrideExistingModule();
    mHasConstants = moduleInfo.hasConstants();
    mProvider = provider;
    if (moduleInfo.needsEagerInit()) {
      mModule = create();
    }
  }

  public ModuleHolder(NativeModule nativeModule) {
    mName = nativeModule.getName();
    mCanOverrideExistingModule = nativeModule.canOverrideExistingModule();
    mHasConstants = true;
    mModule = nativeModule;
    PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.NATIVE_MODULE, "NativeModule init: %s", mName);
  }

  /*
  * Checks if mModule has been created, and if so tries to initialize the module unless another
  * thread is already doing the initialization.
  * If mModule has not been created, records that initialization is needed
  */
  /* package */ void markInitializable() {
    boolean shouldInitializeNow = false;
    NativeModule module = null;
    synchronized (this) {
      mInitializable = true;
      if (mModule != null) {
        Assertions.assertCondition(!mIsInitializing);
        shouldInitializeNow = true;
        module = mModule;
      }
    }
    if (shouldInitializeNow) {
      doInitialize(module);
    }
  }

  /* pacakge */ synchronized boolean hasInstance() {
    return mModule != null;
  }

  public synchronized void destroy() {
    if (mModule != null) {
      mModule.onCatalystInstanceDestroy();
    }
  }

  @DoNotStrip
  public String getName() {
    return mName;
  }

  public boolean getCanOverrideExistingModule() {
    return mCanOverrideExistingModule;
  }

  public boolean getHasConstants() {
    return mHasConstants;
  }

  @DoNotStrip
  public NativeModule getModule() {
    NativeModule module;
    boolean shouldCreate = false;
    synchronized (this) {
      if (mModule != null) {
        return mModule;
      // if mModule has not been set, and no one is creating it. Then this thread should call create
      } else if (!mIsCreating) {
        shouldCreate = true;
        mIsCreating = true;
      } else  {
        // Wait for mModule to be created by another thread
      }
    }
    if (shouldCreate) {
      module = create();
      // Once module is built (and initialized if markInitializable has been called), modify mModule
      // And signal any waiting threads that it is acceptable to read the field now
      synchronized (this) {
        mIsCreating = false;
        this.notifyAll();
      }
      return module;
    } else {
      synchronized (this) {
        // Block waiting for another thread to build mModule instance
        // Since mIsCreating is true until after creation and instantiation (if needed), we wait
        // until the module is ready to use.
        while (mModule == null && mIsCreating) {
          try {
            this.wait();
          } catch (InterruptedException e) {
            continue;
          }
        }
        return Assertions.assertNotNull(mModule);
      }
    }
  }

  private NativeModule create() {
    SoftAssertions.assertCondition(mModule == null, "Creating an already created module.");
    ReactMarker.logMarker(CREATE_MODULE_START, mName, mInstanceKey);
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ModuleHolder.createModule")
      .arg("name", mName)
      .flush();
    PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.NATIVE_MODULE, "NativeModule init: %s", mName);
    NativeModule module;
    try {
      module = assertNotNull(mProvider).get();
      mProvider = null;
      boolean shouldInitializeNow = false;
      synchronized(this) {
        mModule = module;
        if (mInitializable && !mIsInitializing) {
          shouldInitializeNow = true;
        }
      }
      if (shouldInitializeNow) {
        doInitialize(module);
      }
    } finally {
      ReactMarker.logMarker(CREATE_MODULE_END, mInstanceKey);
      SystraceMessage.endSection(TRACE_TAG_REACT_JAVA_BRIDGE).flush();
    }
    return module;
  }

  private void doInitialize(NativeModule module) {
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ModuleHolder.initialize")
      .arg("name", mName)
      .flush();
    ReactMarker.logMarker(ReactMarkerConstants.INITIALIZE_MODULE_START, mName, mInstanceKey);
    try {
      boolean shouldInitialize = false;
      // Check to see if another thread is initializing the object, if not claim the responsibility
      synchronized (this) {
        if (mInitializable && !mIsInitializing) {
          shouldInitialize = true;
          mIsInitializing = true;
        }
      }
      if (shouldInitialize) {
        module.initialize();
        // Once finished, set flags accordingly, but we don't expect anyone to wait for this to finish
        // So no need to notify other threads
        synchronized (this) {
          mIsInitializing = false;
        }
      }
    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.INITIALIZE_MODULE_END, mInstanceKey);
      SystraceMessage.endSection(TRACE_TAG_REACT_JAVA_BRIDGE).flush();
    }
  }
}
