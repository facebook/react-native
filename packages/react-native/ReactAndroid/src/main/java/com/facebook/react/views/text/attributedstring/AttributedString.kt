/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.attributedstring

/** Interface for an attributed string */
internal interface AttributedString {
  fun getFragment(index: Int): AttributedStringFragment

  val fragmentCount: Int
}
