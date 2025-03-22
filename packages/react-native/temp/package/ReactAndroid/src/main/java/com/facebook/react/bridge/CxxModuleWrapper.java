/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** This does nothing interesting, except avoid breaking existing code. */
@DoNotStrip
public class CxxModuleWrapper extends CxxModuleWrapperBase {
  protected CxxModuleWrapper(HybridData hd) {
    super(hd);
  }
}
