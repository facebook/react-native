/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

data class ModelAutolinkingDependenciesJson(
    val root: String,
    val name: String,
    val platforms: ModelAutolinkingDependenciesPlatformJson?,
) {

  val nameCleansed: String
    get() = name.replace(Regex("[~*!'()]+"), "_").replace(Regex("^@([\\w-.]+)/"), "$1_")
}
