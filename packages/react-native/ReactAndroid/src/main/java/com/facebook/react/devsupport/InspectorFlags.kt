/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.proguard.annotations.DoNotStrip

/** JNI wrapper for `jsinspector_modern::InspectorFlags`. */
@DoNotStrip
public object InspectorFlags {
  init {
    DevSupportSoLoader.staticInit()
  }

  @DoNotStrip @JvmStatic public external fun getFuseboxEnabled(): Boolean
}
