/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

/**
 * Exception thrown when a class tries to access a native view by a tag that has no native view
 * associated with it.
 */
public class NoSuchNativeViewException extends IllegalViewOperationException {

  public NoSuchNativeViewException(String detailMessage) {
    super(detailMessage);
  }
}
