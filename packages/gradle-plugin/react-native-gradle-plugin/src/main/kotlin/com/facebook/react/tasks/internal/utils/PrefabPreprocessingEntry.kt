/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal.utils

import java.io.Serializable

/**
 * This data class represents an entry that can be consumed by the [PreparePrefabHeadersTask].
 *
 * @param libraryName The name of the library that you're preparing for Prefab
 * @param pathToPrefixCouples A list of pairs Path to Header prefix. You can use this list to supply
 *   a list of paths that you want to be considered for prefab. Each path can specify an header
 *   prefix that will be used by prefab to re-created the header layout.
 */
data class PrefabPreprocessingEntry(
    val libraryName: String,
    val pathToPrefixCouples: List<Pair<String, String>>,
) : Serializable {
  constructor(
      libraryName: String,
      pathToPrefixCouple: Pair<String, String>,
  ) : this(libraryName, listOf(pathToPrefixCouple))
}
