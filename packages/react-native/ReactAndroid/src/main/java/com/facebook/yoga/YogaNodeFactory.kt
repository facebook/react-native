/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public object YogaNodeFactory {
  @JvmStatic public fun create(): YogaNode = YogaNodeJNIFinalizer()

  @JvmStatic public fun create(config: YogaConfig): YogaNode = YogaNodeJNIFinalizer(config)
}
