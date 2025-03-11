/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture

/** Interface for a module that will be notified when a batch of JS->Java calls has finished. */
@LegacyArchitecture
public fun interface OnBatchCompleteListener {
  public fun onBatchComplete()
}
