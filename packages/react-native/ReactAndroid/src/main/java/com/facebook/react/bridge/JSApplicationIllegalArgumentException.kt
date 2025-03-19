/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/** An illegal argument Exception caused by an argument passed from JS. */
public class JSApplicationIllegalArgumentException : JSApplicationCausedNativeException {

  public constructor(detailMessage: String) : super(detailMessage)

  public constructor(detailMessage: String, t: Throwable) : super(detailMessage, t)
}
