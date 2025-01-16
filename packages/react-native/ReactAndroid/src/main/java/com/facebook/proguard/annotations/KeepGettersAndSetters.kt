/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.proguard.annotations

import kotlin.annotation.AnnotationRetention
import kotlin.annotation.AnnotationTarget

/**
 * Add this annotation to a class, to keep all "void set*(***)" and get* methods.
 *
 * This is useful for classes that are controlled by animator-like classes that control various
 * properties with reflection.
 *
 * **NOTE:** This is *not* needed for Views because their getters and setters are automatically kept
 * by the default Android SDK ProGuard config.
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.BINARY)
public annotation class KeepGettersAndSetters
