/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/**
 * Interface that should be implemented by [android.view.View] subclasses that support [overflow]
 * style. This allows the overflow information to be used by [TouchTargetHelper] to determine if a
 * View is touchable.
 */
public interface ReactOverflowView {
  /**
   * Gets the overflow state of a view. If set, this should be one of [ViewProps#HIDDEN],
   * [ViewProps#VISIBLE] or [ViewProps#SCROLL].
   */
  public val overflow: String?
}
