// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.module.model;

/**
 * Data holder class holding native module specifications.
 */
public class ReactModuleInfo {

  public final String mName;
  public final boolean mCanOverrideExistingModule;
  public final boolean mSupportsWebWorkers;
  public final boolean mNeedsEagerInit;

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
}
