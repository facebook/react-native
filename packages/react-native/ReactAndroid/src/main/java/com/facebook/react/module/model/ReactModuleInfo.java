/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
  private String mClassName;
  private final boolean mIsTurboModule;

  public ReactModuleInfo(
      String name,
      String className,
      boolean canOverrideExistingModule,
      boolean needsEagerInit,
      boolean hasConstants,
      boolean isCxxModule,
      boolean isTurboModule) {
    mName = name;
    mClassName = className;
    mCanOverrideExistingModule = canOverrideExistingModule;
    mNeedsEagerInit = needsEagerInit;
    mHasConstants = hasConstants;
    mIsCxxModule = isCxxModule;
    mIsTurboModule = isTurboModule;
  }

  public String name() {
    return mName;
  }

  public String className() {
    return mClassName;
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

  public boolean isCxxModule() {
    return mIsCxxModule;
  }

  public boolean isTurboModule() {
    return mIsTurboModule;
  }
}
