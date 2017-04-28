// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.cxxbridge;

import javax.annotation.Nullable;
import javax.inject.Provider;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;

import static com.facebook.infer.annotation.Assertions.assertNotNull;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_MODULE_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_MODULE_START;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

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

  private final String mName;
  private final boolean mCanOverrideExistingModule;
  private final boolean mHasConstants;

  private @Nullable Provider<? extends NativeModule> mProvider;
  private @Nullable NativeModule mModule;
  private boolean mInitializeNeeded;

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
  }

  public synchronized void initialize() {
    if (mModule != null) {
      doInitialize(mModule);
    } else {
      mInitializeNeeded = true;
    }
  }

  public synchronized boolean isInitialized() {
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
  public synchronized NativeModule getModule() {
    if (mModule == null) {
      mModule = create();
    }
    return mModule;
  }

  private NativeModule create() {
    SoftAssertions.assertCondition(mModule == null, "Creating an already created module.");
    ReactMarker.logMarker(CREATE_MODULE_START, mName);
    SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "createModule")
      .arg("name", mName)
      .flush();
    NativeModule module;
    try {
      module = assertNotNull(mProvider).get();
      mProvider = null;
      if (mInitializeNeeded) {
        doInitialize(module);
        mInitializeNeeded = false;
      }
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      ReactMarker.logMarker(CREATE_MODULE_END);
    }
    return module;
  }

  private void doInitialize(NativeModule module) {
    SystraceMessage.Builder section =
      SystraceMessage.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "initialize");
    if (module instanceof CxxModuleWrapper) {
      section.arg("className", module.getClass().getSimpleName());
    } else {
      section.arg("name", mName);
    }
    section.flush();
    ReactMarker.logMarker(ReactMarkerConstants.INITIALIZE_MODULE_START, mName);
    try {
      module.initialize();
    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.INITIALIZE_MODULE_END);
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }
}
