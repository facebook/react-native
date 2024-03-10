/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.model;

import com.facebook.react.turbomodule.core.interfaces.TurboModule;

/**
 * Data holder class holding native module specifications. {@link ReactModuleSpecProcessor} creates
 * these so Java modules don't have to be instantiated at React Native start up.
 */
public class ReactModuleInfo {

  private final String mName;
  private final boolean mCanOverrideExistingModule;
  private final boolean mNeedsEagerInit;
  private final boolean mIsCxxModule;
  private final String mClassName;
  private final boolean mIsTurboModule;

  public ReactModuleInfo(
      String name,
      String className,
      boolean canOverrideExistingModule,
      boolean needsEagerInit,
      boolean isCxxModule,
      boolean isTurboModule) {
    mName = name;
    mClassName = className;
    mCanOverrideExistingModule = canOverrideExistingModule;
    mNeedsEagerInit = needsEagerInit;
    mIsCxxModule = isCxxModule;
    mIsTurboModule = isTurboModule;
  }

  /**
   * @deprecated use {@link ReactModuleInfo#ReactModuleInfo(String, String, boolean, boolean,
   *     boolean, boolean)}
   */
  @Deprecated
  public ReactModuleInfo(
      String name,
      String className,
      boolean canOverrideExistingModule,
      boolean needsEagerInit,
      boolean hasConstants,
      boolean isCxxModule,
      boolean isTurboModule) {
    this(name, className, canOverrideExistingModule, needsEagerInit, isCxxModule, isTurboModule);
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

  /** @deprecated this is hardcoded to return true, regardless if the module has constants or not */
  @Deprecated
  public boolean hasConstants() {
    return true;
  }

  public boolean isCxxModule() {
    return mIsCxxModule;
  }

  public boolean isTurboModule() {
    return mIsTurboModule;
  }

  /**
   * Checks if the passed class is a TurboModule. Useful to populate the parameter [isTurboModule]
   * in the constructor of ReactModuleInfo.
   */
  public static boolean classIsTurboModule(Class<?> clazz) {
    return TurboModule.class.isAssignableFrom(clazz);
  }
}
