/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import com.facebook.jni.HybridData;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.soloader.SoLoader;

/**
 * JSCallInvoker is created at a different time/place (i.e: in CatalystInstance) than
 * TurboModuleManager. Therefore, we need to wrap JSCallInvoker within a hybrid class so that we may
 * pass it from CatalystInstance, through Java, to TurboModuleManager::initHybrid.
 */
public class CallInvokerHolderImpl implements CallInvokerHolder {
  static {
    SoLoader.loadLibrary("turbomodulejsijni");
  }

  private final HybridData mHybridData;

  private CallInvokerHolderImpl(HybridData hd) {
    mHybridData = hd;
  }
}
