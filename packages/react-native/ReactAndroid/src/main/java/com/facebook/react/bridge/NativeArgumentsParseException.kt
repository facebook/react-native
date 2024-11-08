/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/** Exception thrown when a native module method call receives unexpected arguments from JS. */
internal class NativeArgumentsParseException : JSApplicationCausedNativeException {

  public constructor(detailMessage: String) : super(detailMessage)

  public constructor(detailMessage: String, throwable: Throwable?) : super(detailMessage, throwable)
}
