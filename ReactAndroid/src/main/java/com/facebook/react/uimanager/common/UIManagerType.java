/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common;

import static com.facebook.react.uimanager.common.UIManagerType.DEFAULT;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static java.lang.annotation.RetentionPolicy.SOURCE;

import androidx.annotation.IntDef;
import java.lang.annotation.Retention;

@Retention(SOURCE)
@IntDef({DEFAULT, FABRIC})
public @interface UIManagerType {
  int DEFAULT = 1;
  int FABRIC = 2;
}
