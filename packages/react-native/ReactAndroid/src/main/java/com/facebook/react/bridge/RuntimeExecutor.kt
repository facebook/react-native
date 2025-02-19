/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip

/** A Kotlin holder for a C++ RuntimeExecutor. */
@DoNotStrip public class RuntimeExecutor @DoNotStrip private constructor() : HybridClassBase()
