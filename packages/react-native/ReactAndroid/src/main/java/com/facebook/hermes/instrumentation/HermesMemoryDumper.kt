/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.hermes.instrumentation

public interface HermesMemoryDumper {
    public fun shouldSaveSnapshot(): Boolean

    public val internalStorage: String?

    public val id: String?

    public fun setMetaData(crashId: String?)
}
