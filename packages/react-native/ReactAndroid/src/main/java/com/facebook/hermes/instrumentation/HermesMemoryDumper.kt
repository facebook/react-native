/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.instrumentation

internal interface HermesMemoryDumper {
  fun shouldSaveSnapshot(): Boolean

  fun getInternalStorage(): String

  fun getId(): String

  fun setMetaData(crashId: String)
}
