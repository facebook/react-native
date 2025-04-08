/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.style.StrikethroughSpan

/** Wraps [StrikethroughSpan] as a [ReactSpan]. */
internal class ReactStrikethroughSpan : StrikethroughSpan(), ReactSpan
