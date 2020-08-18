/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Interface that represent javascript callback function which can be passed to the native module as
 * a method parameter.
 */
public interface Callback {

  /**
   * Schedule javascript function execution represented by this {@link Callback} instance
   *
   * @param args arguments passed to javascript callback method via bridge
   */
  public void invoke(Object... args);
}
