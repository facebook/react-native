/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * This interface includes the methods needed to use a running JS instance, without specifying any
 * of the bridge-specific initialization or lifecycle management.
 */
public interface JSInstance {
  public fun invokeCallback(callbackID: Int, arguments: NativeArrayInterface)

  // TODO if this interface survives refactoring, think about adding
  // callFunction.
}
