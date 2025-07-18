/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

/**
 * Maps a section of the text to the index of the AttributedString fragment originally used to
 * create it.
 */
internal class ReactFragmentIndexSpan(val fragmentIndex: Int) : ReactSpan
