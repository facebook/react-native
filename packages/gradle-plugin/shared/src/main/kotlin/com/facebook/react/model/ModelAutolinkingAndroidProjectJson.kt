/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

data class ModelAutolinkingAndroidProjectJson(
    val sourceDir: String,
    val appName: String,
    val packageName: String,
    val applicationId: String,
    val mainActivity: String,
    val watchModeCommandParams: List<String>?,
    val dependencyConfiguration: String?,
)
