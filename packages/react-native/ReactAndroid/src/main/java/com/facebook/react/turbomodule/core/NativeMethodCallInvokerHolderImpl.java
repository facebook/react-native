/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.internal.turbomodule.core.NativeModuleSoLoader;
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder;

/**
 * NativeMethodCallInvokerHolder is created at a different time/place (i.e: in CatalystInstance)
 * than TurboModuleManager. Therefore, we need to wrap NativeMethodCallInvokerHolder within a hybrid
 * class so that we may pass it from CatalystInstance, through Java, to
 * TurboModuleManager::initHybrid.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@FrameworkAPI
public class NativeMethodCallInvokerHolderImpl implements NativeMethodCallInvokerHolder {

  @DoNotStrip private final HybridData mHybridData;

  static {
    NativeModuleSoLoader.maybeLoadSoLibrary();
  }

  private NativeMethodCallInvokerHolderImpl(HybridData hd) {
    mHybridData = hd;
  }
}
