/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Paint

/**
 * This interface should be implemented by all [View] subclasses that want to use the mixBlendMode
 * prop to blend with its parent.
 */
public interface ReactMixBlendMode {
  public var mixBlendMode: Paint?

  public fun isBlendModeParent(): Boolean
}
