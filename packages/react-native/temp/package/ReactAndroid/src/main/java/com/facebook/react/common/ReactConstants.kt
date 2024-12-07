/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

public object ReactConstants {

  public const val TAG: String = "ReactNative"

  /**
   * Some types have built-in support for representing a "missing" or "unset" value, for example NaN
   * in the case of floating point numbers or null in the case of object references. Integers don't
   * have such a special value. When an integer represent an inherently non-negative value, we use a
   * special negative value to mark it as "unset".
   */
  public const val UNSET: Int = -1
}
