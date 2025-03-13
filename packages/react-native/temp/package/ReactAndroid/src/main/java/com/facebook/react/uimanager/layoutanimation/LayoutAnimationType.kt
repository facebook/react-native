/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

/**
 * Enum representing the different animation type that can be specified in layout animation config.
 */
internal enum class LayoutAnimationType {
  CREATE,
  UPDATE,
  DELETE;

  companion object {
    @JvmStatic
    fun toString(type: LayoutAnimationType): String {
      return when (type) {
        CREATE -> "create"
        UPDATE -> "update"
        DELETE -> "delete"
      }
    }
  }
}
