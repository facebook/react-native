/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

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
