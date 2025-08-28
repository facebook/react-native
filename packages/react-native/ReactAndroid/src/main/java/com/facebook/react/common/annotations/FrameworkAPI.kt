/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@RequiresOptIn(
    level = RequiresOptIn.Level.ERROR,
    message =
        "This API is provided only for React Native frameworks and not intended for general users. " +
            "This API can change between minor versions in alignment with React Native frameworks " +
            "and won't be considered a breaking change.",
)
public annotation class FrameworkAPI
