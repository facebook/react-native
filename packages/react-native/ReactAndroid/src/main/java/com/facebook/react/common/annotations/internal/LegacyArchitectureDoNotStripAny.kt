/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations.internal

import kotlin.annotation.Retention
import kotlin.annotation.Target

@Target(AnnotationTarget.TYPE)
@Retention(AnnotationRetention.BINARY)
public annotation class LegacyArchitectureDoNotStripAny()
