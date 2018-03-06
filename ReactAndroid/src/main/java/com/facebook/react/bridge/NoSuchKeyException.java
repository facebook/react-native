/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Exception thrown by {@link ReadableNativeMap} when a key that does not exist is requested.
 */
@DoNotStrip
public class NoSuchKeyException extends RuntimeException {

  @DoNotStrip
  public NoSuchKeyException(String msg) {
    super(msg);
  }
}
