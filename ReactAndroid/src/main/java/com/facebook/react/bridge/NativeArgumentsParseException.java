/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;

/** Exception thrown when a native module method call receives unexpected arguments from JS. */
public class NativeArgumentsParseException extends JSApplicationCausedNativeException {

  public NativeArgumentsParseException(String detailMessage) {
    super(detailMessage);
  }

  public NativeArgumentsParseException(@Nullable String detailMessage, @Nullable Throwable t) {
    super(detailMessage, t);
  }
}
