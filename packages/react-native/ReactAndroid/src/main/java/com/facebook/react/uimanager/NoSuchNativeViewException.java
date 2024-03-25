/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.infer.annotation.Nullsafe;

/**
 * Exception thrown when a class tries to access a native view by a tag that has no native view
 * associated with it.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class NoSuchNativeViewException extends IllegalViewOperationException {

  public NoSuchNativeViewException(String detailMessage) {
    super(detailMessage);
  }
}
