/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core

import com.facebook.jni.HybridClassBase
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder

/**
 * JSCallInvoker is created at a different time/place (i.e: in CatalystInstance) than
 * TurboModuleManager. Therefore, we need to wrap JSCallInvoker within a hybrid class so that we may
 * pass it from CatalystInstance, through Java, to TurboModuleManager::initHybrid.
 */
@FrameworkAPI
public class CallInvokerHolderImpl private constructor() : HybridClassBase(), CallInvokerHolder
