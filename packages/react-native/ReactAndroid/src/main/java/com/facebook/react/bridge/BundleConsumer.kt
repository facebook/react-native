/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.fabric.BigStringBufferWrapper

public interface BundleConsumer {
  public fun setScriptWrapper(scriptWrapper: BigStringBufferWrapper)
  public fun setSourceURL(sourceURL: String)
}
