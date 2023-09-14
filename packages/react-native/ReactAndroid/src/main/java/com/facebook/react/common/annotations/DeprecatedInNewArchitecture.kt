/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations

/**
 * Annotates a method or class that will be deprecated once the NewArchitecture is fully released in
 * OSS.
 */
@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
annotation class DeprecatedInNewArchitecture()
