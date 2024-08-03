/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

/** Interface for a list of [TextFragment]s */
internal interface TextFragmentList {
  fun getFragment(index: Int): TextFragment

  val count: Int
}
