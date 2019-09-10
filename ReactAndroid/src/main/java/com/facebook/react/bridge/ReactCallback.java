/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.Keep;

@Keep
/* package */ interface ReactCallback {
  @Keep
  void onBatchComplete();

  @Keep
  void incrementPendingJSCalls();

  @Keep
  void decrementPendingJSCalls();
}
