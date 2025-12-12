/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

internal data class FrameTimingSequence(
    val id: Int,
    val threadId: Int,
    val beginDrawingTimestamp: Long,
    val commitTimestamp: Long,
    val endDrawingTimestamp: Long,
    val screenshot: String? = null,
)
