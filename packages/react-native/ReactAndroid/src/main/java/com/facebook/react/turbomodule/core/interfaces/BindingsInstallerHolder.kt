/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core.interfaces

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip

/** A Java holder for a C++ BindingsInstallerHolder. */
@DoNotStrip
public class BindingsInstallerHolder(@field:DoNotStrip private val mHybridData: HybridData)
