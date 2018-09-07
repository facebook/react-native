// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import com.facebook.thecount.api.CountEnum;

@CountEnum
public enum MemoryPressure {
  UI_HIDDEN,
  MODERATE,
  CRITICAL
}
