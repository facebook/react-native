// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.module.model;

/**
 * Data holder class holding native module specifications. {@link ReactModuleSpecProcessor} creates
 * these so Java modules don't have to be instantiated at React Native start up.
 */
public class ReactModuleInfo {

  private final String mName;
  private final boolean mCanOverrideExistingModule;
  private final boolean mSupportsWebWorkers;
  private final boolean mNeedsEagerInit;
  private final boolean mHasConstants;

  public ReactModuleInfo(
    String name,
    boolean canOverrideExistingModule,
    boolean supportsWebWorkers,
    boolean needsEagerInit,
    boolean hasConstants) {
    mName = name;
    mCanOverrideExistingModule = canOverrideExistingModule;
    mSupportsWebWorkers = supportsWebWorkers;
    mNeedsEagerInit = needsEagerInit;
    mHasConstants = hasConstants;
  }

  public String name() {
    return mName;
  }

  public boolean canOverrideExistingModule() {
    return mCanOverrideExistingModule;
  }

  public boolean supportsWebWorkers() {
    return mSupportsWebWorkers;
  }

  public boolean needsEagerInit() {
    return mNeedsEagerInit;
  }

  public boolean hasConstants() {
    return mHasConstants;
  }
}
