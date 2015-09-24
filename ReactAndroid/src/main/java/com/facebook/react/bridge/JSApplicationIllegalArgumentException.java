/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * An illegal argument Exception caused by an argument passed from JS.
 */
public class JSApplicationIllegalArgumentException extends JSApplicationCausedNativeException {

  public JSApplicationIllegalArgumentException(String detailMessage) {
    super(detailMessage);
  }

  public JSApplicationIllegalArgumentException(String detailMessage, Throwable t) {
    super(detailMessage, t);
  }
}
