/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.BindingsInstaller

/**
 * A utility class that provides users a default [BindingsInstaller] class that's used to initialize
 * [ReactHostDelegate]
 */
@DoNotStrip @UnstableReactNativeAPI class DefaultBindingsInstaller : BindingsInstaller(null) {}
