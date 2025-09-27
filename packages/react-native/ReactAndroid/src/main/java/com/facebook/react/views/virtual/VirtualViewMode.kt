/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual

public enum class VirtualViewMode(public val value: Int) {
  Visible(0),
  Prerender(1),
  Hidden(2),
}
