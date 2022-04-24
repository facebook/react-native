/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces;

/**
 * JS CallInvoker is created by CatalystInstance.cpp, but used by TurboModuleManager.cpp. Both C++
 * classes are instantiated at different times/places. Therefore, to pass the JS CallInvoker
 * instance from CatalystInstance to TurboModuleManager, we make it take a trip through Java.
 *
 * <p>This interface represents the opaque Java object that contains a pointer to and instance of
 * CallInvoker.
 */
public interface CallInvokerHolder {}
