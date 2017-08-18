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
 * This interface includes the methods needed to use a running JS
 * instance, without specifying any of the bridge-specific
 * initialization or lifecycle management.
 */
public interface JSInstance {
  void invokeCallback(
      int callbackID,
      NativeArray arguments);
  // TODO if this interface survives refactoring, think about adding
  // callFunction.
}
