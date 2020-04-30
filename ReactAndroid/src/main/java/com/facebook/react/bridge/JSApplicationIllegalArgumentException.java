/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/** An illegal argument Exception caused by an argument passed from JS. */
public class JSApplicationIllegalArgumentException extends JSApplicationCausedNativeException {

  public JSApplicationIllegalArgumentException(String detailMessage) {
    super(detailMessage);
  }

  public JSApplicationIllegalArgumentException(String detailMessage, Throwable t) {
    super(detailMessage, t);
  }
}
