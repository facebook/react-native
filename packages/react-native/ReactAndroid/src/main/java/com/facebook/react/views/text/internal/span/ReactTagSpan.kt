/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

/**
 * Instances of this class are used to place reactTag information of nested text react nodes into
 * spannable text rendered by single [android.widget.TextView]
 */
internal class ReactTagSpan(val reactTag: Int) : ReactSpan
