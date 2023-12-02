/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.bridge.NativeMap;

@DoNotStripAny
public interface UIConstantsProvider {

  /* Returns UIManager's constants. */
  NativeMap getConstants();
}
