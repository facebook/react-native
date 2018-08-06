// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.module.model;

/**
 * Data holder class holding native module specifications. {@link ReactModuleSpecProcessor} creates
 * these so Java modules don't have to be instantiated at React Native start up.
 */
public class ReactModuleInfo {

  private final String mName;
  private final boolean mCanOverrideExistingModule;
  private final boolean mNeedsEagerInit;
  private final boolean mHasConstants;
  private final boolean mIsCxxModule;
  private final boolean mHasOnBatchCompleteListener;

  public ReactModuleInfo(
    String name,
    boolean canOverrideExistingModule,
    boolean needsEagerInit,
    boolean hasConstants,
    boolean isCxxModule,
    boolean hasOnBatchCompleteListener) {
    mName = name;
    mCanOverrideExistingModule = canOverrideExistingModule;
    mNeedsEagerInit = needsEagerInit;
    mHasConstants = hasConstants;
    mIsCxxModule = isCxxModule;
    mHasOnBatchCompleteListener = hasOnBatchCompleteListener;
  }

  public String name() {
    return mName;
  }

  public boolean canOverrideExistingModule() {
    return mCanOverrideExistingModule;
  }

  public boolean needsEagerInit() {
    return mNeedsEagerInit;
  }

  public boolean hasConstants() {
    return mHasConstants;
  }

  public boolean isCxxModule() {return mIsCxxModule; }

  public boolean hasOnBatchCompleteListener() {
    return mHasOnBatchCompleteListener;
  }
}
