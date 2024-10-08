/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import com.facebook.react.ReactHost
import com.facebook.react.devsupport.interfaces.DevSupportManager

public class MyReactHostWrapper(private val defaultReactHost: ReactHost) :
    ReactHost by defaultReactHost {

  override val devSupportManager: DevSupportManager by lazy { MyDevSupportManager(this) }
}
