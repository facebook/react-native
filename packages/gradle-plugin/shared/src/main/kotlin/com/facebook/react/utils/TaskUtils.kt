/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

fun windowsAwareCommandLine(vararg args: Any): List<Any> = windowsAwareCommandLine(args.toList())

fun windowsAwareCommandLine(args: List<Any>): List<Any> =
    if (Os.isWindows()) {
      listOf("cmd", "/c") + args
    } else {
      args
    }

fun windowsAwareBashCommandLine(
    vararg args: String,
    bashWindowsHome: String? = null
): List<String> =
    if (Os.isWindows()) {
      listOf(bashWindowsHome ?: "bash", "-c") + args
    } else {
      args.toList()
    }
