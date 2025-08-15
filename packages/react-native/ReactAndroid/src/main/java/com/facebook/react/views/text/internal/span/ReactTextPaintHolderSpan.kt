/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint

/** Associates a TextPaint instance with a Spannable for convenience */
internal data class ReactTextPaintHolderSpan(val textPaint: TextPaint) : ReactSpan
