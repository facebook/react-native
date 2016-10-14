// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.module.model;

/**
 * Data holder class holding native module specifications. {@link ReactModuleSpecProcessor} creates
 * these so Java modules don't have to be instantiated at React Native start up.
 */
public class ReactModuleInfo implements Info {

  private final String mName;
  private final boolean mCanOverrideExistingModule;
  private final boolean mSupportsWebWorkers;
  private final boolean mNeedsEagerInit;

  public ReactModuleInfo(
    String name,
    boolean canOverrideExistingModule,
    boolean supportsWebWorkers,
    boolean needsEagerInit) {
    mName = name;
    mCanOverrideExistingModule = canOverrideExistingModule;
    mSupportsWebWorkers = supportsWebWorkers;
    mNeedsEagerInit = needsEagerInit;
  }

  @Override
  public String name() {
    return mName;
  }

  @Override
  public boolean canOverrideExistingModule() {
    return mCanOverrideExistingModule;
  }

  @Override
  public boolean supportsWebWorkers() {
    return mSupportsWebWorkers;
  }

  @Override
  public boolean needsEagerInit() {
    return mNeedsEagerInit;
  }
}
