/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.location;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

/**
 * @see {https://developer.mozilla.org/en-US/docs/Web/API/PositionError}
 */
public class PositionError {
  /**
   * The acquisition of the geolocation information failed because
   * the page didn't have the permission to do it.
   */
  public static int PERMISSION_DENIED = 1;

  /**
   * The acquisition of the geolocation failed because at least one
   * internal source of position returned an internal error.
   */
  public static int POSITION_UNAVAILABLE = 2;

  /**
   * The time allowed to acquire the geolocation, defined by
   * PositionOptions.timeout information was reached before the information was obtained.
   */
  public static int TIMEOUT = 3;

  public static WritableMap buildError(int code, String message) {
    WritableMap error = Arguments.createMap();
    error.putInt("code", code);
    if (message != null) {
      error.putString("message", message);
    }
    return error;
  }
}
