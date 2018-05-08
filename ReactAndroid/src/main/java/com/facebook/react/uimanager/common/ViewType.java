/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager.common;

import static com.facebook.react.uimanager.common.ViewType.FABRIC;
import static com.facebook.react.uimanager.common.ViewType.PAPER;
import static java.lang.annotation.RetentionPolicy.SOURCE;

import java.lang.annotation.Retention;
import android.support.annotation.IntDef;

@Retention(SOURCE)
@IntDef({PAPER, FABRIC})
public @interface ViewType {
  int PAPER = 1;
  int FABRIC = 2;
}
