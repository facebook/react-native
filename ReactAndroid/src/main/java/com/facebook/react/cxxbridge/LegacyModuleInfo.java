// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.cxxbridge;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.module.model.Info;

/**
 * Module info for non-lazy native modules.
 */
public class LegacyModuleInfo implements Info {

  public final Class<?> mType;
  public final NativeModule mNativeModule;

  public LegacyModuleInfo(Class<?> type, NativeModule nativeModule) {
    mType = type;
    mNativeModule = nativeModule;
  }

  @Override
  public String name() {
    return mNativeModule.getName();
  }

  @Override
  public boolean canOverrideExistingModule() {
    return mNativeModule.canOverrideExistingModule();
  }

  @Override
  public boolean supportsWebWorkers() {
    return mNativeModule.supportsWebWorkers();
  }

  @Override
  public boolean needsEagerInit() {
    return true;
  }
}
