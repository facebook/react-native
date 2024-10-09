/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common

import androidx.annotation.IntDef
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture

@Retention(AnnotationRetention.SOURCE)
@IntDef(UIManagerType.DEFAULT, UIManagerType.FABRIC)
@DeprecatedInNewArchitecture
public annotation class UIManagerType {
  public companion object {
    public const val DEFAULT: Int = 1
    public const val FABRIC: Int = 2
  }
}
