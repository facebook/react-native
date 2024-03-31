/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

public enum class ErrorType(public val displayName: String) {
  JS("JS"),
  NATIVE("Native");

  override fun toString(): String = displayName
}
