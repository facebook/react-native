/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations.internal

/**
 * Annotation to mark classes or functions that are part of the interop APIs that provide support
 * for legacy architecture APIs in the new architecture of React Native.
 */
@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
public annotation class InteropLegacyArchitecture
