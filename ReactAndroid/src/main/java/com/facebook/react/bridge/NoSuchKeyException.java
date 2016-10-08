/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
