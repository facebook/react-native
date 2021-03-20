/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.process.ExecSpec

internal fun ExecSpec.windowsAwareCommandLine(vararg args: Any) {
  if (Os.isFamily(Os.FAMILY_WINDOWS)) {
    commandLine(listOf("cmd", "/c") + args)
  } else {
    commandLine(args.toList())
  }
}
