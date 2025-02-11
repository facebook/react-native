/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.instrumentation

public interface HermesMemoryDumper {
  public fun shouldSaveSnapshot(): Boolean

  public fun getInternalStorage(): String

  public fun getId(): String

  public fun setMetaData(crashId: String)
}
