// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import javax.inject.Provider;

import com.facebook.react.bridge.NativeModule;

/**
 * Provider for an already initialized and non-lazy NativeModule.
 */
public class EagerModuleProvider implements Provider<NativeModule> {

  private final NativeModule mModule;

  public EagerModuleProvider(NativeModule module) {
    mModule = module;
  }

  @Override
  public NativeModule get() {
    return mModule;
  }
}
