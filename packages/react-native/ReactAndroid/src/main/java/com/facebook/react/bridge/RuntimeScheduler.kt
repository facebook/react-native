/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip

/** A Kotlin holder for a C++ RuntimeScheduler. */
public class RuntimeScheduler(@DoNotStrip private val mHybridData: HybridData)
