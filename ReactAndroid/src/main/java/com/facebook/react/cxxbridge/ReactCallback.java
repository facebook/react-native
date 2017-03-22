/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
/* package */ interface ReactCallback {
  @DoNotStrip
  void onBatchComplete();

  @DoNotStrip
  void incrementPendingJSCalls();

  @DoNotStrip
  void decrementPendingJSCalls();
}
