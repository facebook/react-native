/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

public fun interface BundleLoadCallback {
  public fun onSuccess(): Unit

  public fun onError(cause: Exception): Unit = Unit
}
