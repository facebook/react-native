/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common

import androidx.annotation.IntDef

@Retention(AnnotationRetention.SOURCE)
@Suppress("DEPRECATION")
@IntDef(UIManagerType.DEFAULT, UIManagerType.LEGACY, UIManagerType.FABRIC)
public annotation class UIManagerType {
  public companion object {
    @Deprecated(
        "UIManagerType.DEFAULT will be deleted in the next release of React Native. Use [LEGACY] instead.")
    public const val DEFAULT: Int = 1
    public const val LEGACY: Int = 1
    public const val FABRIC: Int = 2
  }
}
