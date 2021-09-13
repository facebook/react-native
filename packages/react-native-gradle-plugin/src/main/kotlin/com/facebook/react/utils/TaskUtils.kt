/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

internal fun windowsAwareCommandLine(vararg args: Any): List<Any> =
    if (Os.isWindows()) {
      listOf("cmd", "/c") + args
    } else {
      args.toList()
    }
